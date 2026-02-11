import sys
import json
import cv2
import numpy as np
import os

def analyze_skin(image_path):
    if not os.path.exists(image_path):
        return {"error": "Image file not found"}

    # Read image
    image = cv2.imread(image_path)
    if image is None:
        return {"error": "Failed to read image"}

    # Convert to Grayscale for detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Load Haar Cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    if face_cascade.empty():
        return {"error": "Failed to load face cascade classifier"}

    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )
    
    if len(faces) == 0:
        return {"error": "No face detected"}
    
    # Use the largest face
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    x, y, w, h = faces[0]
    
    # Define ROI based on face box geometry
    # Forehead: Center top
    fh_y1 = int(y + 0.15 * h)
    fh_y2 = int(y + 0.25 * h)
    fh_x1 = int(x + 0.3 * w)
    fh_x2 = int(x + 0.7 * w)
    
    # Left Cheek (Viewer's left)
    lc_y1 = int(y + 0.5 * h)
    lc_y2 = int(y + 0.7 * h)
    lc_x1 = int(x + 0.15 * w)
    lc_x2 = int(x + 0.35 * w)
    
    # Right Cheek (Viewer's right)
    rc_y1 = int(y + 0.5 * h)
    rc_y2 = int(y + 0.7 * h)
    rc_x1 = int(x + 0.65 * w)
    rc_x2 = int(x + 0.85 * w)
    
    regions = {
        "forehead": image[fh_y1:fh_y2, fh_x1:fh_x2],
        "left_cheek": image[lc_y1:lc_y2, lc_x1:lc_x2],
        "right_cheek": image[rc_y1:rc_y2, rc_x1:rc_x2]
    }
    
    extracted_colors = []
    
    for name, roi in regions.items():
        if roi.size > 0:
            avg = np.mean(roi, axis=(0, 1))
            extracted_colors.append(avg)
            
    if not extracted_colors:
         return {"error": "Failed to extract skin regions"}
         
    avg_skin_bgr = np.mean(extracted_colors, axis=0)
    
    # Convert to Lab for brightness (L)
    # OpenCV uses L: 0-255, a: 0-255, b: 0-255
    lab_pixel = cv2.cvtColor(np.uint8([[avg_skin_bgr]]), cv2.COLOR_BGR2Lab)[0][0]
    L, a, b = lab_pixel
    
    # Determine Skin Tone based on L (Lightness)
    # Adjusted thresholds for OpenCV L scale
    if L > 190:
        skin_tone = "Fair"
    elif L > 160:
        skin_tone = "Light"
    elif L > 130:
        skin_tone = "Medium"
    elif L > 90:
        skin_tone = "Tan"
    else:
        skin_tone = "Deep"
        
    # Determine Undertone based on a and b
    # Neutral is around 128
    a_norm = float(a) - 128
    b_norm = float(b) - 128
    
    if b_norm > 5 and b_norm > a_norm:
        undertone = "Warm" # Yellow dominant
    elif a_norm > 5 and a_norm > b_norm:
        undertone = "Cool" # Red/Pink dominant
    else:
        undertone = "Neutral"
        
    # Detect Concerns (Heuristics)
    concerns = []
    
    # Redness: High 'a' in cheeks
    # Extract just cheeks average
    cheeks = []
    if regions["left_cheek"].size > 0: cheeks.append(np.mean(regions["left_cheek"], axis=(0,1)))
    if regions["right_cheek"].size > 0: cheeks.append(np.mean(regions["right_cheek"], axis=(0,1)))
    
    if cheeks:
        cheek_avg = np.mean(cheeks, axis=0)
        cheek_lab = cv2.cvtColor(np.uint8([[cheek_avg]]), cv2.COLOR_BGR2Lab)[0][0]
        cheek_a = float(cheek_lab[1]) - 128
        if cheek_a > 15:
            concerns.append("Redness")

    # Dark Circles / Dullness - hard with just regions, but let's use L
    if L < 100 and skin_tone in ["Fair", "Light"]:
         concerns.append("Dullness")
    
    # Oiliness: Check variance/standard deviation in forehead (T-zone)
    if regions["forehead"].size > 0:
        fh_gray = cv2.cvtColor(regions["forehead"], cv2.COLOR_BGR2GRAY)
        std_dev = np.std(fh_gray)
        # High specular reflection -> high contrast -> high std dev?
        # Or maybe check max brightness vs avg brightness
        if std_dev > 40: # Arbitrary threshold
             concerns.append("Oily Skin")
    
    if not concerns:
        concerns.append("None")
        
    # Confidence: Haar is less confident than Mesh, but if detected, it's okay.
    confidence = 0.85

    return {
        "skinTone": skin_tone,
        "undertone": undertone,
        "skinType": "Combination" if "Oily Skin" in concerns else "Normal",
        "concerns": concerns,
        "confidence": confidence,
        "debug_values": {
            "L": float(L),
            "a": float(a),
            "b": float(b)
        }
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No image path provided"}))
            sys.exit(1)
            
        image_path = sys.argv[1]
        
        # Perform analysis
        analysis_result = analyze_skin(image_path)
        
        # Print JSON to stdout for Node.js to capture
        print(json.dumps(analysis_result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


const http = require('http');

const EXPECTED_FIELDS = [
    'Product_ID',
    'Name',
    'Price',
    'Thumbnail_Images',
    'Category',
    'Is_Skincare'
];

function checkFields(product) {
    const keys = Object.keys(product);
    console.log("Received Keys:", keys);
    console.log("Product Data:", JSON.stringify(product, null, 2));

    const missing = EXPECTED_FIELDS.filter(f => !keys.includes(f));
    // Optional check: Ensure no extra fields like _id (unless intended)
    // The previous implementation sent everything via product.toObject() or just the doc.
    // Our new implementation should ONLY send the mapped fields.
    // However, some fields might be missing if they are undefined in DB?
    // Our mapper does: Is_Skincare || false. Others are direct access.

    console.log(`Checking product: ${product.Name || 'Unknown'}`);
    if (missing.length > 0) {
        console.error("FAILED: Missing fields:", missing);
        return false;
    }

    // Check for Leaked Fields
    const leaked = ['_id', '__v', 'Category_Slug', 'Status'].filter(f => keys.includes(f));
    if (leaked.length > 0) {
        console.warn("WARNING: Potential leaked internal fields (should be empty if strict mapping is working):", leaked);
        // Note: getAllProducts returns { data: [mappedProducts] }
        // The mappedProduct object should NOT have _id.
    } else {
        console.log("SUCCESS: No leaked internal fields.");
    }

    return true;
}

const req = http.get('http://localhost:5000/api/products?limit=1', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.data && json.data.length > 0) {
                const isValid = checkFields(json.data[0]);
                if (isValid) console.log("VERIFICATION PASSED: API matches Frontend Contract.");
                else console.log("VERIFICATION FAILED.");
            } else {
                console.log("No products found to verify.");
            }
        } catch (e) {
            console.error("Error parsing response:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

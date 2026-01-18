// using native fetch


// Adjust URL if needed, default assuming localhost:5000 as per server.js
const BASE_URL = 'http://localhost:5000/api/products';

async function testApi() {
    try {
        console.log("1. Testing No Filter (Default)...");
        const res1 = await fetch(BASE_URL);
        const data1 = await res1.json();
        console.log(`Status: ${res1.status}`);
        // console.log("Data:", JSON.stringify(data1.data ? data1.data.slice(0, 1) : data1, null, 2));

        console.log("\n2. Testing Search (keyword=red)...");
        const res2 = await fetch(`${BASE_URL}?keyword=red`);
        const data2 = await res2.json();
        console.log(`Status: ${res2.status}, Count: ${data2.total}`);

        console.log("\n3. Testing Sort (sort=price_asc)...");
        const res3 = await fetch(`${BASE_URL}?sort=price_asc`);
        const data3 = await res3.json();
        const prices = data3.data.map(p => p.Price);
        console.log(`Status: ${res3.status}, Prices (First 5): ${prices.slice(0, 5)}`);

        console.log("\n4. Testing Sort (sort=best_seller)...");
        const res4 = await fetch(`${BASE_URL}?sort=best_seller`);
        console.log(`Status: ${res4.status}`);

        console.log("\n5. Testing Pagination (limit=2)...");
        const res5 = await fetch(`${BASE_URL}?limit=2`);
        const data5 = await res5.json();
        console.log(`Status: ${res5.status}, Limit: ${data5.limit}, Data Length: ${data5.data.length}`);

        console.log("\n6. Testing Skin Type Filter (skinType=Oily)...");
        const res6 = await fetch(`${BASE_URL}?skinType=Oily`);
        const data6 = await res6.json();
        console.log(`Status: ${res6.status}, Count: ${data6.total}`);

        console.log("\n7. Testing Category Regex (category=cushion)...");
        const res7 = await fetch(`${BASE_URL}?category=cushion`);
        const data7 = await res7.json();
        console.log(`Status: ${res7.status}, Count: ${data7.total}`);

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testApi();

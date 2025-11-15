const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const capitals = require("./capitals.json");
const folder = "./capital_images";

// Create folder if it doesn't exist
if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}

// Stats tracking
let successCount = 0;
let failCount = 0;
let replaceCount = 0;
let newCount = 0;

// Delay helper function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean filename to remove illegal characters
function sanitizeFilename(city) {
    return city.replace(/[/\\?%*:|"<>]/g, "_");
}

async function downloadImage(city) {
    try {
        const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(city)}`;
        console.log(`[${successCount + failCount + 1}/${capitals.length}] Fetching: ${city}`);

        // Fetch Wikipedia page with realistic browser headers
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Referer": "https://www.google.com/",
                "DNT": "1"
            },
            timeout: 15000,
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);

        // Find first infobox image
        const img = $(".infobox img").first();
        const src = img.attr("src") || img.attr("data-src");

        if (!src) {
            console.log(`  ⚠ No image found for ${city}`);
            failCount++;
            return;
        }

        // Convert protocol-relative URL to https
        const fullUrl = src.startsWith("http") ? src : "https:" + src;
        const filename = sanitizeFilename(city);
        const imgPath = `${folder}/${filename}.jpg`;

        // Check if file already exists
        const fileExists = fs.existsSync(imgPath);

        // Download image with proper headers
        const imgData = await axios.get(fullUrl, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": url,
                "DNT": "1"
            },
            timeout: 15000
        });

        // Save image (overwrite if exists)
        fs.writeFileSync(imgPath, imgData.data);

        if (fileExists) {
            console.log(`  ✔ Replaced: ${city}`);
            replaceCount++;
        } else {
            console.log(`  ✔ Downloaded: ${city}`);
            newCount++;
        }

        successCount++;

    } catch (err) {
        console.log(`  ⚠ Error: ${city} - ${err.message}`);
        failCount++;
    }
}

(async function () {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🌍 Wikipedia Image Downloader for Capital Cities`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Total cities to process: ${capitals.length}\n`);

    const startTime = Date.now();

    for (let i = 0; i < capitals.length; i++) {
        const city = capitals[i];
        await downloadImage(city);

        // Add random delay between 1-3 seconds (except for last iteration)
        if (i < capitals.length - 1) {
            const delayMs = 1000 + Math.random() * 2000; // 1-3 seconds
            await delay(delayMs);
        }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toFixed(0);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🏁 DOWNLOAD COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✔ Successfully downloaded:  ${successCount}`);
    console.log(`  - New images:             ${newCount}`);
    console.log(`  - Replaced images:        ${replaceCount}`);
    console.log(`⚠ Failed downloads:         ${failCount}`);
    console.log(`⏱ Time taken:               ${minutes}m ${seconds}s`);
    console.log(`${"=".repeat(60)}\n`);
})();

# 🌐 Cloudinary Image Hosting Setup

This app uses **Cloudinary CDN** to host capital city images instead of storing them in Git. This keeps the repository fast to clone and easy to manage.

---

## 📊 Why Cloudinary?

**Problem:**
- 186+ capital images = 5.6MB
- Future plans: 1,500+ images across all topics
- Git repos shouldn't store large image folders
- Slows down cloning and increases repo size

**Solution:**
- Free Cloudinary CDN hosting
- Fast global image delivery
- Automatic image optimization
- Easy to add more images

---

## 🚀 Setup Instructions

### Step 1: Sign Up for Cloudinary (FREE)

1. Go to: https://cloudinary.com/users/register_free
2. Sign up for a **free account**
3. You get:
   - 25 GB storage
   - 25 GB monthly bandwidth
   - 25,000 transformations/month
   - **More than enough for this app!**

### Step 2: Get Your Cloud Name

1. After signing up, go to: https://cloudinary.com/console
2. Find your **Cloud Name** (top left corner)
3. Copy it (e.g., `dxxxxxxxxx`)

### Step 3: Create Folder Structure

1. In Cloudinary Console, go to **Media Library**
2. Create this folder structure:
   ```
   Quizzena/
   └── capitals/
   ```

### Step 4: Upload Capital Images

**Option A: Upload via Web Interface**
1. Navigate to `Quizzena/capitals/` folder
2. Click **Upload**
3. Drag & drop all 186 images from your local `capital_images/` folder
4. Wait for upload to complete

**Option B: Upload via CLI (Advanced)**
```bash
# Install Cloudinary CLI
npm install -g cloudinary-cli

# Configure CLI
cld config

# Upload all images
cld uploader upload capital_images/* --folder Quizzena/capitals
```

### Step 5: Update script.js

1. Open `script.js`
2. Find this line near the top:
   ```javascript
   const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
   ```
3. Replace `YOUR_CLOUD_NAME` with your actual cloud name
4. Change this line to enable CDN:
   ```javascript
   const USE_LOCAL_IMAGES = false;
   ```

### Step 6: Test

1. Commit and push your changes:
   ```bash
   git add script.js
   git commit -m "Configure Cloudinary cloud name"
   git push origin main
   ```
2. Wait 1-2 minutes for GitHub Pages to rebuild
3. Test the Capitals quiz
4. Images should now load from Cloudinary CDN! 🎉

---

## 🔧 Configuration Options

### Development Mode (Local Images)
Use this while developing locally:
```javascript
const USE_LOCAL_IMAGES = true;
```
- Loads images from `./capital_images/` folder
- Faster local testing
- No internet required

### Production Mode (CDN)
Use this for GitHub Pages:
```javascript
const USE_LOCAL_IMAGES = false;
```
- Loads images from Cloudinary CDN
- Fast global delivery
- Bandwidth optimized

---

## 📁 Image URL Format

Images are accessed via:
```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/v1/Quizzena/capitals/{CITY_NAME}.jpg
```

**Examples:**
- London: `https://res.cloudinary.com/dxxxxxxxxx/image/upload/v1/Quizzena/capitals/London.jpg`
- Paris: `https://res.cloudinary.com/dxxxxxxxxx/image/upload/v1/Quizzena/capitals/Paris.jpg`
- New Delhi: `https://res.cloudinary.com/dxxxxxxxxx/image/upload/v1/Quizzena/capitals/New%20Delhi.jpg`

---

## 🆘 Troubleshooting

### Images not loading?

**Check 1: Cloud Name**
- Make sure `CLOUDINARY_CLOUD_NAME` in `script.js` matches your actual cloud name
- No typos!

**Check 2: Folder Path**
- Images must be in: `Quizzena/capitals/`
- Case-sensitive!

**Check 3: Image Names**
- Must match exactly: `London.jpg`, not `london.jpg`
- Spaces allowed: `New Delhi.jpg`

**Check 4: Browser Console**
- Open DevTools (F12)
- Check Console for 404 errors
- Check Network tab for failed image requests

### Still not working?

**Fallback Mode:**
The app automatically falls back to Picsum placeholder images if Cloudinary images fail to load. This ensures the quiz always works.

To temporarily use placeholders:
```javascript
const CLOUDINARY_CLOUD_NAME = 'invalid-cloud-name';
```

---

## 📈 Future Scalability

This setup is ready for all planned quiz topics:

| Topic | Images | Size | Status |
|-------|--------|------|--------|
| Capitals | 186 | 5.6MB | ✅ Ready |
| Borders | 190 | ~8MB | 📋 Planned |
| Area | 190 | ~8MB | 📋 Planned |
| Football | 500+ | ~20MB | 📋 Planned |
| Movies | 500+ | ~25MB | 📋 Planned |
| **Total** | **1,500+** | **~70MB** | - |

With Cloudinary, we can easily handle all these images without bloating the Git repository!

---

## 💰 Cost

**Free tier includes:**
- 25 GB storage (we need ~70MB = 0.3% used)
- 25 GB bandwidth/month
- 25,000 transformations/month

**Expected usage:**
- ~1,000 quiz plays/month
- ~5,000 image loads/month
- Well within free limits! ✅

---

## 🔗 Useful Links

- Cloudinary Console: https://cloudinary.com/console
- Cloudinary Docs: https://cloudinary.com/documentation
- Media Library: https://cloudinary.com/console/media_library
- Upload API: https://cloudinary.com/documentation/image_upload_api_reference

---

## ✅ Checklist

- [ ] Sign up for Cloudinary
- [ ] Get Cloud Name
- [ ] Create `Quizzena/capitals/` folder
- [ ] Upload 186 capital images
- [ ] Update `CLOUDINARY_CLOUD_NAME` in script.js
- [ ] Set `USE_LOCAL_IMAGES = false`
- [ ] Commit and push
- [ ] Test on GitHub Pages

---

**Last Updated:** November 2024  
**Maintained by:** Quizzena Development Team

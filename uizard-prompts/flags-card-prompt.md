# Uizard Auto-Generator Prompts for Quiz Topic Cards

## Design System Reference
All cards use a **floating circular design** with:
- 140x140px circular container
- Centered image with cover sizing
- Gradient glow effect behind
- Title below the circle

---

## 🌍 FLAGS CARD

### Prompt Option 1 (Globe with Flags):
```
Create a circular icon featuring a 3D globe with colorful national flags planted around it. 
The globe should be a deep blue with subtle continent outlines. 
Multiple small waving flags in vibrant colors (red, blue, green, yellow, white) surrounding the globe.
Dark gradient background fading to transparent edges.
High quality, modern, glossy style with subtle lighting effects.
Centered composition for circular crop.
```

### Prompt Option 2 (Waving Flags Collection):
```
Create a circular icon showing a collection of 5-6 colorful waving national flags arranged in a fan pattern.
Include recognizable flag colors: red/white stripes, blue with stars, green/white/red tricolor.
Flags should appear to be waving dynamically with fabric folds and shadows.
Dark navy to black gradient background with subtle sparkle effects.
Modern 3D render style, high quality, centered for circular crop.
```

### Prompt Option 3 (Single Iconic Flag):
```
Create a circular icon of a single majestic waving flag on a golden flagpole.
The flag should have abstract colorful stripes representing world diversity (rainbow of national colors).
Flag fabric flowing dramatically with realistic shadows and highlights.
Dark background with subtle world map silhouette.
Cinematic lighting, high quality 3D render, centered composition.
```

### Prompt Option 4 (Earth with Flag Pins):
```
Create a circular icon showing Earth from space with glowing pin markers across continents.
Each pin has a tiny flag waving at the top.
Earth should have a blue glow effect around it.
Deep space background with stars.
Futuristic, high-tech style, suitable for quiz app.
Centered composition for circular crop.
```

---

## 🏆 CHAMPIONS LEAGUE CARD (Reference)

### Prompt Used:
```
Create a circular icon of a silver trophy cup with ornate handles.
Dramatic starburst light rays emanating from behind the trophy.
Sparkling particles and bokeh effects surrounding it.
Dark black background with silver/white highlights.
Prestigious, champion feel, high quality 3D render.
Centered composition for circular crop.
```

---

## 🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE CARD (Reference)

### Prompt Used:
```
Create a circular icon featuring the Premier League lion logo or a golden lion head.
Regal, majestic pose with crown or royal elements.
Purple to magenta gradient glow effects.
Dark background with subtle sparkles.
Premium, prestigious sports style.
Centered composition for circular crop.
```

---

## Implementation Code Template

Once you have the Uizard-generated image URL, use this HTML structure:

```html
<!-- Flags Card - Floating Circular Design -->
<div class="status-active" style="flex-shrink: 0;">
  <button id="flags-topic-btn" class="floating-card-topic floating-card-flags" style="cursor: pointer; font-family: inherit;">
    <!-- Glow behind -->
    <div class="floating-card-glow floating-card-glow-flags"></div>
    
    <!-- Circular image container -->
    <div class="floating-card-circle">
      <img src="[YOUR_UIZARD_IMAGE_URL]" alt="Flags" class="floating-card-image">
    </div>
    
    <!-- Title below -->
    <div class="floating-card-title">Flags</div>
  </button>
</div>
```

### CSS for Flags Theme (Green/Teal):
```css
/* Flags variant - Green/Teal glow */
.floating-card-glow-flags {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, rgba(52, 211, 153, 0.3) 40%, transparent 70%);
}

.floating-card-flags .floating-card-circle {
  background: linear-gradient(135deg, #34d399 0%, #059669 50%, #10b981 100%);
  box-shadow: 0 0 15px rgba(52, 211, 153, 0.4), 0 0 30px rgba(5, 150, 105, 0.2);
}

.floating-card-flags .floating-card-title {
  color: #34d399;
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
}
```

---

## Quick Uizard Settings

| Setting | Value |
|---------|-------|
| Image Size | 512x512 or 1024x1024 |
| Style | 3D Render / Realistic |
| Background | Dark/Transparent |
| Composition | Centered |
| Quality | High |

---

## Color Themes for Each Card

| Card | Primary | Secondary | Glow |
|------|---------|-----------|------|
| Premier League | Purple #a78bfa | Pink #ec4899 | Purple |
| Champions League | Blue #60a5fa | Silver #93c5fd | Blue |
| Flags | Green #34d399 | Teal #10b981 | Green |
| World Cup | Gold #fbbf24 | Red #ef4444 | Gold |
| Football | Green #22c55e | White #fff | Green |






























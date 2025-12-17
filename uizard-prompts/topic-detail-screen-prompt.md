# 🎮 Topic Detail Screen - Uizard Prompts

---

## 🎯 MAIN PROMPT (Copy this):

```
Mobile quiz game mode selection screen. Dark navy background.

Top: back arrow left, "Add to Slot" button right.

Center: Large circular icon with glow, "Flags Quiz" title below.

Level card with glassmorphism effect, "Level 1" text, purple XP progress bar, "0/40 XP".

"Choose Game Mode" header.

4 stacked buttons:
- Casual: purple gradient, lightning icon, glowing
- Time Attack: dark gray, lock icon, "Reach Level 5" subtitle
- 3 Hearts: dark gray locked, "Reach Level 10" subtitle
- 2 Players: purple gradient, unlocked

Style: Premium gaming UI, glassmorphism, purple/blue colors, dark theme.
```

---

## 🎨 SHORTER ALTERNATIVES:

### Option A - Full Screen:
```
Dark mobile game screen. Quiz mode selection. Purple gradient buttons for unlocked modes, gray locked buttons with gold lock icons. Glassmorphism level card showing "Level 1" with XP bar. Premium gaming aesthetic.
```

### Option B - Just Buttons:
```
4 game mode buttons for quiz app. Purple gradient for unlocked (Casual, 2 Players). Dark frosted glass for locked (Time Attack, 3 Hearts) with lock icons. Stacked vertically. Dark background.
```

### Option C - Level Card Only:
```
Glassmorphism level card for mobile game. Shows "Level 1" with star, purple XP progress bar, "0/40 XP" text. Dark navy background. Premium gaming style.
```

---

## 🔧 Implementation Notes

After generating in Uizard, implement these CSS enhancements:

```css
/* Level Card - Glassmorphism */
.level-card {
  background: rgba(30, 27, 75, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 20px;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
}

.level-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), transparent, rgba(59, 130, 246, 0.1));
  border-radius: inherit;
}

/* XP Progress Bar */
.xp-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.xp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #9333ea, #3b82f6, #22d3ee);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Unlocked Mode Button */
.mode-btn-unlocked {
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #3b82f6 100%);
  border: none;
  border-radius: 16px;
  padding: 18px 24px;
  color: white;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(147, 51, 234, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.mode-btn-unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(147, 51, 234, 0.4);
}

/* Locked Mode Button */
.mode-btn-locked {
  background: rgba(30, 27, 75, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 18px 24px;
  color: rgba(255, 255, 255, 0.5);
}

.mode-btn-locked .lock-icon {
  color: #fbbf24;
}
```

---

## 📱 Screen Dimensions Reference

| Device | Width | Height |
|--------|-------|--------|
| iPhone 14 | 390px | 844px |
| iPhone 14 Pro Max | 430px | 932px |
| Android (Common) | 360px | 800px |
| Design Target | 390px | 844px |

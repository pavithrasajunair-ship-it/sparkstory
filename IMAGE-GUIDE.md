# Adding real photos to the genre backgrounds

StorySpark now has built-in cinematic scenes for every genre. If you add real photographs (or AI-made images you have the right to use),
the site shows them instead, with a slow camera zoom, parallax, film grain, colour grade, fog, rain and particles on top.
If a photo is missing or fails to load, the built-in scene is used. Nothing breaks.

## 1. Make the images
- Size: 1920 x 1080 (desktop) and 900 x 1600 (phone). Keep each file under about 250 KB (desktop) and 120 KB (phone).
- Format: WebP (required), AVIF (optional, smaller).
- Names: one file per genre key.
    desktop:  scenes/<key>.webp        phone:  scenes/<key>-m.webp
    keys: darkromance, romance, horror, mystery, thriller, fantasy, adventure, scifi, humor, drama, bedtime, psych
- Convert with Squoosh (squoosh.app) or:  cwebp -q 72 -resize 1920 0 input.jpg -o scenes/horror.webp
- Leave space in the middle of the picture: the story controls sit there.

## 2. Tell the site which images exist
Edit scenes/manifest.json. Example:
{
  "darkromance": { "mobile": true },
  "horror":      { "mobile": true, "avif": true },
  "romance":     { "mobile": true }
}
Genres not listed keep the built-in scene.
Add "replaceArt": false to a genre if you want the built-in drawings to stay on top of the photo.

## 3. Where images can come from (check the licence yourself)
- Your own photographs.
- Free-to-use libraries: Unsplash, Pexels, Pixabay. Read each licence, keep a record of the page you took each image from, and do not use images with identifiable people or brands.
- Images you generate yourself with an AI image tool, if its terms allow commercial use.
- Do NOT use film stills, Google image results or other people's artwork.

## 4. Prompts for AI image tools (one per genre)
Style for all: "photorealistic, cinematic, shot on a full-frame camera, 35mm lens, shallow depth of field, volumetric light, fine film grain, 16:9, no people, no text, no watermark".
- darkromance: candlelit bedroom at night, deep red satin sheets scattered with rose petals, tall candles on a dark wooden table, wine glass and bottle, heavy velvet curtains, moonlight through an arched window.
- romance: golden-hour sunset over a calm sea, string lights on a garden pergola in soft bokeh, pink and peach sky, floating petals, warm rose-gold glow.
- horror: abandoned Victorian mansion on a hill at night, thick low fog, bare trees, a single lit window, pale full moon, desaturated blue-green tones.
- mystery: rainy city alley at night, wet cobblestones reflecting amber windows, one street lamp, drifting mist, moody blue and amber.
- thriller: empty rain-soaked highway at night, flashing red and blue light in the distance, heavy rain, cold steel tones.
- fantasy: enchanted forest with glowing mushrooms and drifting light particles, a distant castle on a cliff, a glowing waterfall, aurora in the sky.
- adventure: vast mountain valley at sunrise, layered ridges in mist, ancient stone ruins on a peak, dramatic golden sky.
- scifi: ringed planet over a dark horizon, deep star field, faint nebula.
- humor: bright confetti falling against a warm orange-pink studio backdrop, soft bokeh.
- drama: empty theatre stage with red velvet curtains and a single warm spotlight, floating dust.
- bedtime: moonlit rolling hills, big soft moon, stars, calm blue-purple night.
- psych: abstract concentric ripples of violet light on dark water.

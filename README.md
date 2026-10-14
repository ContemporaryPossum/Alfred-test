# Alfred Wong Kai Xiang, portfolio website

Live at https://portfolio.alfredwkxuk.workers.dev

Plain HTML, CSS and JavaScript. No framework, no build step, no add-on libraries, and no sub-folders: every file sits in one folder so it can be dragged straight into a GitHub repository. Double-click `index.html` to preview it locally.

## Files (all in the root folder)

```
index.html                       the whole site (one page)
styles.css                       all styling and the scroll effects; design tokens at the top in :root
main.js                          smooth scrolling, entrances, the work reel and every interactive part
_headers                         Cloudflare caching and security headers (read by Cloudflare, not served)
robots.txt
alfred-about.webp                portrait (960 x 1280), also the first frame of the hero video
alfred-loop.mp4                  hero video: the portrait, gently moving, loops seamlessly (834 x 1112, 5 s)
alfred-desk.mp4, alfred-desk.webp   About film and its still (1280 x 720, 6 s)
alfred-reel.mp4, alfred-reel.webp   social media Reel and its still (720 x 1280, 5 s)
og-image.jpg                     1200 x 630 link preview for WhatsApp, Facebook, LinkedIn
favicon-32.png, favicon-512.png, apple-touch-icon.png
bricolage-grotesque-latin.woff2  display font (SIL Open Font License)
geist-latin.woff2                body font (SIL Open Font License)
*-desktop.webp / *-mobile.webp   screenshots of the nine example client sites (1600 x 900 and 360 x 800)
*-full.webp                      full-length homepage screenshots (1200 px wide)
```

The three videos were made with Higgsfield from Alfred's own photo. The hero video animates the real portrait. The desk and café scenes are AI-generated pictures of Alfred, not real footage.

## Design

Minimal and editorial: a warm near-black page, off-white type, generous space, and one accent colour (tangerine `--accent`) used only for buttons, the word "customers.", small list marks and the process line. Display type is Bricolage Grotesque, body text is Geist. One corner radius (16px) for surfaces, pill-shaped buttons.

## How the page moves

Every section reacts to scrolling, and the effects are tied directly to the scroll position, so they run forwards and backwards with the page. They use CSS scroll-driven animations (current Chrome, Edge and Safari). In browsers without them the page shows everything in its final state, and nothing is lost. Visitors who prefer reduced motion get a still page and still images instead of video.

1. **Intro.** The site types four lines to the visitor, then splits open. Once per visit, skippable, skipped for reduced motion. Add `?intro` to the address to watch it again.
2. **Hero.** Headline words rise in, the portrait video opens. As you scroll away the words drift up and the portrait settles back. The speech bubble asides are in `main.js` (search for `say(`).
3. **Statement.** "More than 20 websites..." lights up word by word as you scroll past it. The client names below slide only while you scroll.
4. **Work.** On desktop the section holds still while your scrolling slides the nine example projects sideways, with a thin progress line. Resting the mouse on a preview scrolls through that whole homepage. On phones, tablets and older browsers it is a row you swipe, with arrow buttons for mouse users.
5. **Services.** The website screenshot scrolls inside its frame as you scroll the page; the phone beside it and the Reel video drift and tilt. The caption switcher (English, Malay, Mandarin) and the three-question helper sit below.
6. **Now picture yours.** The phone tips up into place as it arrives. Type a business name and it builds a sketch homepage; "Start a project" copies the details into the form.
7. **Process.** A line draws across the four steps and lights each one in turn.
8. **About.** The desk film opens from a small frame to the full screen, then "Hello, I am Alfred." rises in, followed by the introduction and facts.
9. **Contact.** The form shows a live preview of the WhatsApp message and opens WhatsApp when sent. Nothing is stored.
10. **Footer.** The name fills from dark to light as the page ends.

On desktop the mouse wheel is eased so the whole page glides (`main.js`, "smooth wheel scrolling"). Keyboard, scrollbar, touch and reduced-motion users get normal scrolling.

## Hosting on Cloudflare

The site is hosted on Cloudflare (Workers & Pages) and connected to the GitHub repository https://github.com/ContemporaryPossum/AlfredWongKaiXiang. There is no build command: Cloudflare serves the files in the root exactly as they are.

- **Updating the site.** Upload or edit files in the GitHub repository. Every push redeploys the site automatically, usually within a minute or two. If a build fails at "Cloning", press Retry build.
- **Headers.** `_headers` sets how long browsers may cache fonts, images and videos, and adds basic security headers. HTML, CSS and JS are always checked for a newer version. Images and videos are cached for a week, so if you replace one, give the new file a new filename and update `index.html`.
- **Custom domain.** Cloudflare dashboard > Workers & Pages > select the project > Settings > Domains & Routes > Add > Custom domain. Then replace every `https://portfolio.alfredwkxuk.workers.dev` in `index.html` with the new address.

## Contact form

The form needs no backend. Pressing Send opens WhatsApp with the visitor's details pre-filled as a message to +60 10-507 2222. If your number ever changes, update it in three places in `index.html`: the WhatsApp button (`wa.me/...`), the form's `action`, and its `data-whatsapp` attribute.

## Still to do

- **Testimonials.** The section is in `index.html` with a `hidden` attribute and two draft quotes. Once Michael Gan (Selangor Welding & Racking) and K&W World Engineering approve the wording, edit the text and delete `hidden` from `<section class="quotes" ... hidden>`.
- **Example captions.** Check the Malay and Mandarin wording in the social media section (search `index.html` for `Example post caption`).

## Editing content

- **Copy.** All page text lives in `index.html`, except the intro lines, speech bubble asides, helper questions and phone sketch wording, which are in `main.js`. The tone is calm and plain, with no exclamation marks.
- **The 20+ figure.** It appears in the statement, the work heading and the About facts (`data-count="20"`). Update all three when it changes.
- **Adding a project.** In the work section, copy one `<li class="wcard" ...>` block and change `--tone` (the client's brand colour, used for the underline on hover), `data-full` (the full-length screenshot, 1200 px wide WebP; leave it out if you have none), the link, both images (`*-desktop.webp` 1600 x 900 and `*-mobile.webp` 360 x 800), the name and the two meta lines. Add the name to the ticker too. The reel works out its own length.
- **Colours and fonts.** Change the values in `:root` at the top of `styles.css`.

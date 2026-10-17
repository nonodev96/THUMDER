# Accessibility statement

_Prepared on 17 October 2026, by self-assessment_

THUMDER wants anyone to be able to learn with it, also with a screen reader, with the keyboard only or with low vision.

## Status

THUMDER is **partially conformant** with the [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), level AA: it meets most of the criteria, with the limitations listed below.

## What has been done

- **Keyboard:** almost everything works with the keyboard, with the focus always visible. The simulation has shortcuts: F5 runs or pauses, F10 steps one cycle, Shift+F10 goes back one, F8 runs to the end and Shift+F5 loads the program. The floating windows of the multiview move with Alt and the arrow keys, and change their size with Alt, Shift and the arrow keys.
- **Screen readers:** buttons and controls have names; the tables of the code, the memory and the registers are presented as tables; the state of the simulation and the notifications are announced by themselves.
- **Text as well as drawings:** the Code table says which stage each instruction is in and explains what it does; Registers, Memory and Statistics give in text what the pipeline and the clock cycle diagram draw.
- **Vision:** light and dark themes with checked contrast, and a layout that adapts to narrow screens and to the zoom of the browser.
- **Motion:** the system preference to reduce motion is respected.
- **Tests:** every change passes automatic tests with [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.1 A and AA) on every view and in both themes.

## Known limitations

- **Canvas drawings:** the pipeline, the datapath and the clock cycle diagram are drawings. Their information is also in text (see above), but some details, such as the exact path of the data along the datapath, are only in the drawing.
- **Code editor:** the editor (Monaco) works with screen readers, but some marks are visual, such as the underline of the errors; the errors are also listed in the Problems panel.
- **Multiview:** reordering the views by dragging them needs a mouse or a touch screen; with the keyboard, each view can be opened as a floating window and moved with Alt and the arrow keys.
- **Third party documents:** some pages of the documentation come from other projects and may have images without a full description.

## Tell us what fails

If you find a barrier, or need some content in another format, open an issue on [GitHub](https://github.com/nonodev96/THUMDER/issues) with the label "accessibility". It will be answered as soon as possible.

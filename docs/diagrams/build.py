#!/usr/bin/env python3
"""Build both diagrams: standalone .svg (slide-ready) + .html (interactive) + .png."""
import gen
import m1, m2

gen.build("01_modules",
          "AI Compliance Tool \u2014 High-Level Module Overview",
          "modules", m1.W, m1.H, m1.body)
gen.build("02_architecture",
          "AI Compliance Tool \u2014 System Architecture",
          "architecture", m2.W, m2.H, m2.body)
print("\nDELIVERABLES:")
print("  HTML  (interactive, dark mode + pan/zoom): docs/diagrams/html/01_modules.html, 02_architecture.html")
print("  SVG   (standalone, slide-ready):           docs/diagrams/sources/01_modules.svg, 02_architecture.svg")
print("  PNG   (preview):                           docs/diagrams/renders/01_modules.png, 02_architecture.png")

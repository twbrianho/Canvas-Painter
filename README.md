# Canvas Painter

### Introduction
Since there exist a lot of similar websites and programs, my goal with this project was to build a canvas that was 
different, with its own personality and style, as well as being somewhat intuitive to use. The first decision I made 
was to separate the functions into a **OPTIONS** section and a **TOOLS** section, to help users find what they're 
looking for faster. Another function I decided on early in the design process was having a tooltip-like line of text 
at the top to explain what is happening, as well as simple instructions for using the tools.

### Top-Down View
#### - Info Section
Displays instructions on how to use tools and system feedback on what was selected.

#### - Canvas Section
The cursor changes depending on which tool is currently chosen. If no tool is currently active, it will revert to 
the default icon.

#### - Tools Section
With the exception of the Text tool, all tools are permanently activated once selected (which will show as an *enlarged* and 
*colorful* icon on the toolbar) until another tool or Import Image is selected. The Text tool is deactivated after each use, 
taking into account that it normally wouldn't need to be repeatedly used.

* Pencil

* Eraser

* Text

* Rectangle

* Circle

* Triangle

#### - Options Section
The options are permanently selected (i.e. if you choose the Gradient texture for the Pencil tool and switch to the 
Rectangle tool, the Gradient texture will still be selected) until overwritten by new selections. This is in 
consideration that an overall style is usually maintained within one painting, enabling users to maintain a swift workflow.

* Color Picker

* Text Input (shows the text in the selected font)

* Font Selection (drop-down menu)

* Size Slider (for both *pencil* and *text*)

* Texture Selection
    1. Plain (chosen color)
    2. Gradient (chosen color, from lighter to darker)
    3. Wooden (a repeating image pattern)

* Upload Image
    * Scale (click and drag)
    * Fill screen (press F)
    * Optional ratio lock (hold Shift)

* Download

* Others
    * Undo (with animation)
    * Redo (with animation)
    * Reset (with animation)
    
### User Guide
Most operations start with *selecting a tool*, after which, there is an intuitive method of usage for each tool.

* **Pencil**: Click mouse to start drawing. Adjust the *color*, *stroke width*, and *texture* from the sidebar.
The 3 textures provided are, from left to right:
    1. **Plain**: just the chosen color
    2. **Gradient**: propagates the chosen color between a lighter and darker hue, oscillating as you draw.
    3. **Wooden**: a wooden pattern is printed over the drawn path

* **Eraser**: Click the mouse to start erasing. Erased spots will return to the canvas's original white.

* **Text**: Type the desired text in the textarea on the sidebar, and pick a *color*, *font*, *size*, and *texture* as well. 
Hovering the cursor over the canvas will show where the text will print and how it looks. Clicking will set the text 
down at that spot. The gradient texture for the Text tool is vertically linear.

* **Rectangle**: Click and drag to create rectangular shapes. Adjust the *color* and *texture* from the sidebar. The 
gradient texture for the Rectangle tool is vertically linear.

* **Circle**: Click and drag to create circular shapes. Adjust the *color* and *texture* from the sidebar. The gradient 
texture for the Circle tool is radial.

* **Triangle**: Click and drag to create Triangular shapes. Adjust the *color* and *texture* from the sidebar. The 
gradient texture for the Triangle tool is vertically linear.

* **Upload Image**: Clicking this option will prompt you to select an image to upload from your computer. Once uploaded, 
you will have the freedom to pick one of the following:
    * **Press F** to fill the canvas with the image, scaling it to match the height and width of the canvas.
    * **Click and drag** (like the Rectangle tool) to decide where and how big to set the image.
    * **Hold Shift** while dragging to keep the original image's aspect ratio (i.e. w:h) the same as its original.

* **Download**: Clicking this option will download the canvas to your computer's local directory.

* **Redo & Undo**: Clicking this option goes back or forward one save state. A canvas state is saved every time an 
operation is finished.

* **Reset**: Clicking this option clears the canvas back to its original white background. This is undoable.

### Asset Credits
* Wood board background from [Wallpaper Abyss](https://wall.alphacoders.com/big.php?i=8).

* Wooden shelf source image from [Decor Dev](https://www.decordev.com/photo/#aHR0cHM6Ly93d3cuc2VkZW50YXJ5YmVoYXZpb3VyY2xhc3NpZmljYXRpb24ubmV0L21lZGlhLzIwMTgvMDUvMTQvYmF0aHJvb20tc3RvcmFnZS1hbmQtd2FsbC1zaGVsdmVzLXdvb2Qtc2hlbGYtcG5nLW1pY2hlbGVjaW5mb180NDU3ZmU5YTAyNjViOTk4LmpwZ3xXb29kIFNoZWxmIFBuZyBNaWNoZWxlY2luZm98QmF0aHJvb20gU3RvcmFnZSBhbmQgV2FsbCBTaGVsdmVzfA==), edited by me.

* Seamless repeating wooden texture from [Spoon Graphics](https://blog.spoongraphics.co.uk/freebies/handy-roundup-of-free-seamless-repeating-textures).

* All tool icons (*pencil*, *eraser*, *text*, *rectangle*, *circle*, *triangle*, *upload*, *download*, *redo*, *undo*, and *reset*) designed and created by me.
$(document).ready(function () {
    let canvas = document.getElementById("drawing-canvas");

    let ctx = canvas.getContext("2d");

    let tools = ["pencil", "eraser", "text", "rectangle", "circle", "triangle"]; // All tools in tool bar
    let current_tool = ""; // What tool is currently selected (NOTE: includes "img_paste" for image uploading.)
    let color = "#3E2512"; // Default color
    let font = "Arial";
    let text = "";
    let thickness = 20; // Used for line thickness and ALSO font size
    let texture = "plain"; // Default brush shape is circle
    let grd; // Global placeholder for gradient object
    let grd_color1 = "#907A69"; // Lighter color of gradient
    let grd_color2 = "#1F1B17"; // Darker color of gradient
    let STEPS = 100; // Variable to control how many steps between gradient colors, used for pencil tool
    let grd_step; // Gradient step recorder used for pencil tool
    let grd_dir; // Gradient step direction recorder used for pencil tool
    let grd_inc = []; // Gradient step increment constant used for pencil tool
    let uploaded_img = new Image(); // Stores the uploaded image
    let texture_img = document.getElementById("texture-img"); // The wooden image (for fill-style texture)

    let last_x, last_y; // Updated to draw strokes continuously
    let start_x, start_y; // Recorded to draw shapes from constant start point
    let mouseDown = false; // A safeguard, since we only want to draw on mousemove() if mouse is down

    let temp_canvas; // Stores a snapshot of the canvas, so the draggable shapes aren't permanent
    let canvas_past_stack = []; // Stores past canvas states for the undo button
    let canvas_future_stack = []; // Stores undid canvas states for the redo button

    // A debug tool for seeing redo and undo state
    let show_redo_undo = function () {
        console.log("Len of past and future: " + canvas_past_stack.length + " / " + canvas_future_stack.length);
    };

    //////////////////////
    // HELPER FUNCTIONS //
    //////////////////////

    let rgb2hex = function (rgb) {
        let r = ("0" + parseInt(rgb[0], 10).toString(16)).slice(-2);
        let g = ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2);
        let b = ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2);
        return "#" + r + g + b;
    };

    let hex2rgb = function (hex) {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        return [r, g, b];
    };

    let new_canvas = function () {
        // NOTE: white background makes a difference when downloading the image
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        addNewSaveState();
    };

    // Shows text in info bar
    let show_info = function (info) {
        $("#hint-bar").html(info);
    };

    // Save/load a snapshot of the canvas (so the draggable shapes aren't permanently left)
    let saveTempCanvas = function () {
        temp_canvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    let loadTempCanvas = function () {
        ctx.putImageData(temp_canvas, 0, 0);
    };

    // For undo and redo – push and pop from past and future stacks
    let pushCanvasTo = function (stack) {
        stack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    let displayCanvas = function () {
        ctx.putImageData(canvas_past_stack[canvas_past_stack.length - 1], 0, 0);
    };
    let movePast2Future = function () {
        if (canvas_past_stack.length > 1) {
            // Prevent removal of the first (empty canvas) save state
            let temp = canvas_past_stack.pop();
            if (temp !== undefined) {
                // Only pop non-empty stacks (empty stacks return undefined)
                canvas_future_stack.push(temp);
                show_info("Undo.")
            }
            show_redo_undo();
        } else {
            console.log("First save state cannot be undone.");
            show_info("Cannot undo.");
        }
    };
    let moveFuture2Past = function () {
        let temp = canvas_future_stack.pop();
        if (temp !== undefined) {
            // Only pop non-empty stacks (empty stacks return undefined)
            canvas_past_stack.push(temp);
            show_info("Redo.")
        } else {
            show_info("Cannot redo.");
        }
        show_redo_undo();
    };
    let addNewSaveState = function () {
        canvas_future_stack = [];
        pushCanvasTo(canvas_past_stack);
        console.log("New save state added.");
        show_redo_undo();
    };

    //////////////////////////////////////////
    // HANDLES CHANGES TO ONSCREEN ELEMENTS //
    //////////////////////////////////////////
    // Change color
    let color_update = function () {
        color = $("#color-picker").val();
        // update texture icons too
        $("#texture1").css("background-color", color);
        let rgb = hex2rgb(color);
        let light_rgb = rgb.map(function (val) {
            return val + 100 > 255 ? 255 : val + 100
        });
        let dark_rgb = rgb.map(function (val) {
            return val - 100 < 0 ? 0 : val - 100
        });
        grd_color1 = rgb2hex(light_rgb);
        grd_color2 = rgb2hex(dark_rgb);
        $("#texture2").css("background", "linear-gradient(" + grd_color1 + "," + grd_color2 + ")");
    };

    // Change thickness
    let thickness_update = function () {
        let thicknessRange = $("#thickness-range");
        thickness = thicknessRange.val();
        thicknessRange.next().html(thickness + " px");
    };

    // Change texture
    let texture_update = function () {
        let c1 = "black";
        let c2 = "black";
        let c3 = "black";
        switch (texture) {
            case "plain":
                c1 = "white";
                break;
            case "gradient":
                c2 = "white";
                break;
            case "wooden":
                c3 = "white";
                break;
        }
        $("#texture1").css("border-color", c1);
        $("#texture2").css("border-color", c2);
        $("#texture3").css("border-color", c3);
    };

    // Change tool
    let tool_update = function () {
        for (let i = 0; i < tools.length; i++) {
            if (tools[i] === current_tool) {
                $("#" + current_tool).css("background-image", "url(assets/" + current_tool + ".png)").css("transform", "scale(1.5)");
            } else {
                $("#" + tools[i]).css("background-image", "url(assets/" + tools[i] + "_brown.png)").css("transform", "");
            }
        }
        if (current_tool === "" || current_tool === "img_paste") {
            $("#drawing-canvas").css("cursor", "url(assets/default_cursor.png), auto");
        } else {
            $("#drawing-canvas").css("cursor", "url(assets/" + current_tool + "_cursor.png), auto");
        }
    };

    // Updates all onscreen elements
    let update_all_elements = function () {
        color_update();
        thickness_update();
        texture_update();
        tool_update()
    };

    /////////////////////////////////////////
    // DETECTS CLICKS ON ONSCREEN ELEMENTS //
    /////////////////////////////////////////
    // Color chosen
    $("#color-picker").change(function () {
        color_update();
        show_info("Color set to " + color.toUpperCase());
    });

    // Text input
    $("#text-input").keyup(function () {
        text = $(this).val();
    });

    // Font selected
    $("#font-selector").change(function () {
        font = $(this).children("option:selected").val();
        $("#text-input").css("font-family", font+", sans-serif");
        show_info("Font selected: " + font);
    });

    // Thickness adjusted
    $("#thickness-range").change(function () {
        thickness_update();
    });

    // Texture picked
    $("#texture1").click(function () {
        texture = "plain";
        texture_update();
        show_info("Texture selected: Plain");
    });
    $("#texture2").click(function () {
        texture = "gradient";
        texture_update();
        show_info("Texture selected: Gradient");
    });
    $("#texture3").click(function () {
        texture = "wooden";
        texture_update();
        show_info("Texture selected: Wooden");
    });

    // Upload image clicked
    $("#upload").click(function () {
        // Connects button click to input click
        current_tool = "img_paste";
        tool_update();
        $("#upload-input").trigger('click');
    });
    $("#upload-input").change(function (event1) {
        let reader = new FileReader();
        try {
            reader.readAsDataURL(event1.target.files[0]);
            console.log("File acquired.");
            reader.onload = function (event2) {
                uploaded_img.src = event2.target.result;
                uploaded_img.onload = function () {
                    console.log("Image loaded.");
                    show_info("Click and drag to place image / press F to fill canvas background / hold Shift to keep ratio.");
                };
            };
        } catch (exception) {
            console.log(exception);
            show_info("Sorry, failed to upload image.");
        }
    });

    // Download image clicked
    $("#download").click(function () {
        // Get canvas as an image
        let dl_img = canvas.toDataURL("image/png");
        // Set download link to download this image
        let download = document.getElementById("download_link");
        download.setAttribute("href", dl_img);
    });

    // Undo and redo clicked
    $("#undo").click(function () {
        try {
            movePast2Future();
            displayCanvas();
        } catch (e) {
            show_info("ERROR: Cannot undo.");
        }
    });
    $("#redo").click(function () {
        try {
            moveFuture2Past();
            displayCanvas();
        } catch (e) {
            show_info("ERROR: Cannot redo.");
        }
    });

    // Reset canvas clicked
    $("#reset").click(function () {
        new_canvas();
        show_info("Canvas has been reset!");
    });

    // Tool chosen
    $("#pencil").click(function () {
        current_tool = "pencil";
        tool_update();
        show_info("Hold down mouse to draw. Adjust size, color, and texture from sidebar.");
    });
    $("#eraser").click(function () {
        current_tool = "eraser";
        tool_update();
        show_info("Hold down mouse to erase. Adjust size from sidebar.");
    });
    $("#text").click(function () {
        saveTempCanvas(); // This needs to be done here, because it doesn't start with a click.
        current_tool = "text";
        tool_update();
        show_info("Click to set text position. Adjust size, font, and color from sidebar.");
    });
    $("#rectangle").click(function () {
        current_tool = "rectangle";
        tool_update();
        show_info("Click and drag to draw rectangle.");
    });
    $("#circle").click(function () {
        current_tool = "circle";
        tool_update();
        show_info("Click and drag to draw circle.");
    });
    $("#triangle").click(function () {
        current_tool = "triangle";
        tool_update();
        show_info("Click and drag to draw triangle.");
    });

    ///////////////////////////
    //   DRAWING ON CANVAS   //
    // (The code is a mess.) //
    ///////////////////////////
    $("#drawing-canvas").mousedown(function (e) {
        switch (current_tool) {
            case "pencil":
                last_x = e.pageX - $(this).offset().left;
                last_y = e.pageY - $(this).offset().top;
                if (texture === "plain") {
                    ctx.strokeStyle = color;
                } else if (texture === "gradient") {
                    grd_step = 0;
                    grd_dir = 1;
                    let grd_color1_rgb = hex2rgb(grd_color1);
                    let grd_color2_rgb = hex2rgb(grd_color2);
                    for (let i = 0; i < 3; i++) {
                        grd_inc[i] = (grd_color2_rgb[i] - grd_color1_rgb[i]) / STEPS;
                    }
                    ctx.strokeStyle = grd_color1;
                } else if (texture === "wooden") {
                    ctx.strokeStyle = ctx.createPattern(texture_img, "repeat");
                }
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(last_x, last_y);
                ctx.lineTo(last_x, last_y);
                ctx.stroke();
                ctx.closePath();
                mouseDown = true;
                console.log("Pencil Mode: begin stroke.");
                break;
            case "eraser":
                last_x = e.pageX - $(this).offset().left;
                last_y = e.pageY - $(this).offset().top;
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(last_x, last_y);
                ctx.lineTo(last_x, last_y);
                ctx.stroke();
                mouseDown = true;
                console.log("Eraser Mode: begin stroke.");
                break;
            case "rectangle":
                if (texture === "plain") {
                    ctx.fillStyle = color;
                } else if (texture === "gradient") {
                    // Nothing to do right now, set the texture when the mouse moves
                } else if (texture === "wooden") {
                    ctx.fillStyle = ctx.createPattern(texture_img, "repeat");
                }
                start_x = e.pageX - $(this).offset().left;
                start_y = e.pageY - $(this).offset().top;
                saveTempCanvas();
                mouseDown = true;
                break;
            case "circle":
                if (texture === "plain") {
                    ctx.fillStyle = color;
                } else if (texture === "gradient") {
                    // Nothing to do right now, set the texture when the mouse moves
                } else if (texture === "wooden") {
                    ctx.fillStyle = ctx.createPattern(texture_img, "repeat");
                }
                start_x = e.pageX - $(this).offset().left;
                start_y = e.pageY - $(this).offset().top;
                saveTempCanvas();
                mouseDown = true;
                break;
            case "triangle":
                if (texture === "plain") {
                    ctx.fillStyle = color;
                } else if (texture === "gradient") {
                    // Nothing to do right now, set the texture when the mouse moves
                } else if (texture === "wooden") {
                    ctx.fillStyle = ctx.createPattern(texture_img, "repeat");
                }
                start_x = e.pageX - $(this).offset().left;
                start_y = e.pageY - $(this).offset().top;
                saveTempCanvas();
                mouseDown = true;
                break;
            case "img_paste":
                start_x = e.pageX - $(this).offset().left;
                start_y = e.pageY - $(this).offset().top;
                saveTempCanvas();
                mouseDown = true;
                break;
            case "text":
                // Text position has been chosen, set text at this position.
                let x = e.pageX - $(this).offset().left;
                let y = e.pageY - $(this).offset().top;
                loadTempCanvas();
                if (texture === "plain") {
                    ctx.fillStyle = color;
                } else if (texture === "gradient") {
                    grd = ctx.createLinearGradient(0, y-thickness, 0, y);
                    grd.addColorStop(0, grd_color1);
                    grd.addColorStop(1, grd_color2);
                    ctx.fillStyle = grd;
                } else if (texture === "wooden") {
                    ctx.fillStyle = ctx.createPattern(texture_img, "repeat");
                }
                ctx.font = thickness + "px " + font;
                ctx.fillText(text, x, y);
                current_tool = "";
                tool_update();
                $("#text-input").val("");
                if (text === "") {
                    show_info("Please type some text on the sidebar first.")
                } else {
                    addNewSaveState();
                    show_info("Text printed.");
                }
                break;
        }
    }).mousemove(function (e) {
        switch (current_tool) {
            case "pencil":
                if (mouseDown) {
                    if (texture === "gradient") {
                        let curr_rgb = [];
                        // Interpolate
                        for (let i = 0; i < 3; i++) {
                            curr_rgb[i] = Math.round(hex2rgb(grd_color1)[i] + grd_step*grd_inc[i]);
                        }
                        ctx.strokeStyle = rgb2hex(curr_rgb);
                        console.log(rgb2hex(curr_rgb));
                        grd_step += grd_dir;
                        if (grd_step === STEPS || grd_step === 0) {
                            grd_dir *= -1;
                        }
                    }
                    let x = e.pageX - $(this).offset().left;
                    let y = e.pageY - $(this).offset().top;
                    ctx.beginPath();
                    ctx.moveTo(last_x, last_y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    ctx.closePath(); // Closing paths prevents colors from affecting previous strokes
                    last_x = x;
                    last_y = y;
                }
                break;
            case "eraser":
                if (mouseDown) {
                    let x = e.pageX - $(this).offset().left;
                    let y = e.pageY - $(this).offset().top;
                    ctx.moveTo(last_x, last_y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    last_x = x;
                    last_y = y;
                }
                break;
            case "rectangle":
                if (mouseDown) {
                    let x = e.pageX - $(this).offset().left;
                    let y = e.pageY - $(this).offset().top;
                    loadTempCanvas();
                    if (texture === "gradient") {
                        grd = ctx.createLinearGradient(0, start_y, 0, y);
                        grd.addColorStop(0, grd_color1);
                        grd.addColorStop(1, grd_color2);
                        ctx.fillStyle = grd;
                    }
                    ctx.fillRect(start_x, start_y, x - start_x, y - start_y);
                }
                break;
            case "circle":
                if (mouseDown) {
                    let x = e.pageX - $(this).offset().left;
                    let y = e.pageY - $(this).offset().top;
                    let r = Math.sqrt(Math.pow(x - start_x, 2) + Math.pow(y - start_y, 2));
                    loadTempCanvas();
                    if (texture === "gradient") {
                        grd = ctx.createRadialGradient(start_x, start_y, 0, start_x, start_y, r);
                        grd.addColorStop(0, grd_color2);
                        grd.addColorStop(1, grd_color1);
                        ctx.fillStyle = grd;
                    }
                    ctx.beginPath();
                    ctx.arc(start_x, start_y, r, 0, 2 * Math.PI);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case "triangle":
                if (mouseDown) {
                    let x = e.pageX - $(this).offset().left;
                    let y = e.pageY - $(this).offset().top;
                    let p1x = start_x;
                    let p1y = y;
                    let p2x = x;
                    let p2y = y;
                    let p3x = (x + start_x) / 2;
                    let p3y = start_y;
                    loadTempCanvas();
                    if (texture === "gradient") {
                        grd = ctx.createLinearGradient(0, start_y, 0, y);
                        grd.addColorStop(0, grd_color1);
                        grd.addColorStop(1, grd_color2);
                        ctx.fillStyle = grd;
                    }
                    ctx.beginPath();
                    ctx.moveTo(p1x, p1y);
                    ctx.lineTo(p2x, p2y);
                    ctx.lineTo(p3x, p3y);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case "img_paste":
                if (mouseDown) {
                    let x = e.pageX - $(this).offset().left;
                    let y = e.pageY - $(this).offset().top;
                    loadTempCanvas();
                    if (e.shiftKey === true) {
                        // Shift key is pressed, keep ratio locked
                        let scale_x = (x - start_x) / uploaded_img.width;
                        let scale_y = (y - start_y) / uploaded_img.height;
                        let max_scale = Math.max(scale_x, scale_y);
                        ctx.drawImage(uploaded_img, start_x, start_y, uploaded_img.width * max_scale, uploaded_img.height * max_scale);
                    } else {
                        // Shift key isn't pressed, free ratio
                        ctx.drawImage(uploaded_img, start_x, start_y, x - start_x, y - start_y);
                    }
                }
                break;
            case "text":
                // Show text at this position
                let x = e.pageX - $(this).offset().left;
                let y = e.pageY - $(this).offset().top;
                loadTempCanvas();
                if (texture === "plain") {
                    ctx.fillStyle = color;
                } else if (texture === "gradient") {
                    grd = ctx.createLinearGradient(0, y-thickness, 0, y);
                    grd.addColorStop(0, grd_color1);
                    grd.addColorStop(1, grd_color2);
                    ctx.fillStyle = grd;
                } else if (texture === "wooden") {
                    ctx.fillStyle = ctx.createPattern(texture_img, "repeat");
                }
                ctx.font = thickness + "px " + font;
                ctx.fillText(text, x, y);
                break;
        }
    });
    // NOTE: Mouse up anywhere should stop the stroke/shape, not just on the canvas
    $(document).mouseup(function () {
        switch (current_tool) {
            case "pencil":
                if (mouseDown === true) {
                    console.log("Pencil Mode: end stroke.");
                    addNewSaveState();
                    mouseDown = false;
                }
                break;
            case "eraser":
                if (mouseDown === true) {
                    ctx.closePath();
                    console.log("Eraser Mode: end stroke.");
                    addNewSaveState();
                    mouseDown = false;
                }
                break;
            case "rectangle":
                if (mouseDown === true) {
                    addNewSaveState();
                    mouseDown = false;
                }
                break;
            case "circle":
                if (mouseDown === true) {
                    addNewSaveState();
                    mouseDown = false;
                }
                break;
            case "triangle":
                if (mouseDown === true) {
                    addNewSaveState();
                    mouseDown = false;
                }
                break;
            case "img_paste":
                if (mouseDown === true) {
                    addNewSaveState();
                    mouseDown = false;
                    show_info("Image pasted.");
                    current_tool = "";
                }
                break;
        }
    });

    $(document).keypress(function (e) {
        // If 'F' is pressed
        if (e.keyCode === 102) {
            if (current_tool === "img_paste") {
                // Pastes image scaled to canvas size
                ctx.drawImage(uploaded_img, 0, 0, canvas.width, canvas.height);
                addNewSaveState();
                mouseDown = false; // Just a safety precaution, in case someone was holding the mouse while pressing F
                show_info("Canvas background filled.");
                current_tool = "";
            }
        }
    });

    update_all_elements();
    new_canvas();
});
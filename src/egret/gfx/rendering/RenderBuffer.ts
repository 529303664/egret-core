//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

/**
 * @internal
 */
namespace elf {

    /**
     * @internal
     */
    export interface RenderBuffer {
        /**
         * The width of the render buffer in pixels.
         */
        readonly width:number;

        /**
         * The height of the render buffer in pixels.
         */
        readonly height:number;

        /**
         * Resize the render buffer. It will keep the old content if you pass the contentOffset parameter, the top/left
         * corner of old content will be at (offsetX,offsetY). Otherwise, it clears the old content.
         */
        resize(width:number, height:number, contentOffset?:Point):void;

        /**
         * Specifies the alpha value that is applied to shapes and images before they are drawn onto the render buffer.
         * The value is in the range from 0.0 (fully transparent) to 1.0 (fully opaque).
         */
        setAlpha(value:number):void;

        /**
         * Whether or not images are smoothed when scaled.
         */
        setSmoothing(value:boolean):void;

        /**
         * Sets all pixels in the rectangle defined by starting point (x, y) and size (width, height) to specified color,
         * erasing any previously drawn content.
         */
        clearRect(rect:Rectangle, color?:number):void;

        /**
         * Saves the entire state of the render buffer by pushing the current state onto a stack.
         */
        save():void;

        /**
         * Restores the most recently saved canvas state by popping the top entry in the drawing state stack. If there
         * is no saved state, this method does nothing.
         */
        restore():void;

        /**
         * Resets (overrides) the current transformation to the identity matrix and then invokes a transformation described
         * by the arguments of this method.
         */
        setMatrix(matrix:Matrix):void;

        /**
         * Resets the current transform by the identity matrix.
         */
        resetMatrix():void;

        /**
         * Translates the matrix of buffer along the x and y axes, as specified by the dx and dy parameters.
         */
        translate(dx:number, dy:number):void;

        /**
         * Specifies the type of blend mode to apply when drawing new shapes.
         * @see elf.BlendMode
         */
        setBlendMode(value:BlendMode);

        /**
         * Modify the current clip with the specified rectangle.
         */
        clipRect(rect:Rectangle):void;

        /**
         * Returns a data URI containing a representation of the image in the format specified by the type parameter.
         * (defaults to PNG)
         * @param type A string indicating the image format. The default type is "image/png".
         * @param quality A number between 0 and 1 indicating image quality if the requested type is "image/jpeg"
         * or "image/webp". If this argument is anything else, the default value for image quality is used. The default
         * value is 0.92 for "image/jpeg", and 0.8 for "image/webp". Other arguments are ignored.
         */
        toDataURL(type?:string, quality?:number):string;

        /**
         * Returns the color value for the specified pixel region
         */
        getPixels(x:number, y:number, width:number, height:number):Uint8ClampedArray;

        /**
         * Draws another render buffer to this one, with its top/left corner at (x,y).
         */
        drawBuffer(buffer:RenderBuffer, x:number, y:number):void;

        /**
         * Draws the BitmapData object to the render context, with its top/left corner at (x,y).
         */
        drawImage(data:BitmapData, x:number, y:number):void;

        /**
         * Creates an render buffer with specific size. The new render buffer is "compatible" with this one, in that it
         * will efficiently be able to be drawn into parent render buffer.
         * @param width The width of the render buffer in pixels.
         * @param height The height of the render buffer in pixels.
         * @param temporary Whether the render buffer is created for temporary use.
         * @return A new render buffer instance.
         */
        makeRenderBuffer(width:number, height:number, temporary?:boolean):RenderBuffer;

    }

}
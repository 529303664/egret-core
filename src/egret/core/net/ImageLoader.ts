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

namespace egret {

    /**
     * The Loader class is used to load image (JPG, PNG, or GIF) files. Use the load() method to initiate loading.
     * The loaded image data is in the data property of ImageLoader.
     * @event egret.Event.COMPLETE Dispatched when the net request is complete.
     * @event egret.IOErrorEvent.IO_ERROR Dispatched when the net request is failed.
     */
    export interface ImageLoader extends EventDispatcher {
        /**
         * The data received from the load operation.
         * @default null
         */
        data:BitmapData;

        /**
         * start a load operation。<br/>
         * Note: Calling this method for an already active request (one for which load() has already been
         * called) will abort the last load operation immediately.
         * @param url The URL of the image to be loaded.
         */
        load(url:string):void;

        /**
         * Loads image from binary data stored in a ArrayBuffer object.
         * @param bytes The binary data of the image to be loaded.
         * @version Egret 3.5
         * @platform Native
         */
        loadBytes(bytes:ArrayBuffer):void;
    }


    export let ImageLoader:{
        /**
         * Creates a ImageLoader instance.
         */
        new():ImageLoader;
    };
}
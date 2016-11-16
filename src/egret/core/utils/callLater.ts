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
     * @internal
     */
    export let $callLaterFunctionList:any[] = [];
    /**
     * @internal
     */
    export let $callLaterThisList:any[] = [];
    /**
     * @internal
     */
    export let $callLaterArgsList:any[] = [];

    /**
     * @language zh_CN
     * 延迟函数到屏幕重绘前执行。
     * @param method 要延迟执行的函数
     * @param thisObject 回调函数的this引用
     * @param ...args 函数参数列表
     */
    /**
     * Delay the function to run unless screen is redrawn.
     * @param method The function to be delayed to run
     * @param thisObject this reference of callback function
     * @param ...args Function parameter list
     * @version Egret 2.4
     * @platform Web,Native
     * @includeExample egret/utils/callLater.ts
     */
    export function callLater(method:Function,thisObject:any,...args):void
    {
        $callLaterFunctionList.push(method);
        $callLaterThisList.push(thisObject);
        $callLaterArgsList.push(args);
    }

    /**
     * @internal
     */
    export let $callAsyncFunctionList:any[] = [];
    /**
     * @internal
     */
    export let $callAsyncThisList:any[] = [];
    /**
     * @internal
     */
    export let $callAsyncArgsList:any[] = [];
    /**
     * 异步调用函数
     * @param method {Function} 要异步调用的函数
     * @param thisObject {any} 函数的this引用
     * @param ...args {any} 函数参数列表
     * @internal
     */
    export function $callAsync(method:Function,thisObject:any,...args):void
    {
        $callAsyncFunctionList.push(method);
        $callAsyncThisList.push(thisObject);
        $callAsyncArgsList.push(args);
    }
}
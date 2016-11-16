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
     * @language zh_CN
     * 当加载操作已开始或套接字已接收到数据时，将调度 ProgressEvent 对象。
     * 有两种类型的进程事件：ProgressEvent.PROGRESS 和 ProgressEvent.SOCKET_DATA。
     */
    /**
     * When a load operation has begun or a socket has received data, ProgressEvent object is dispatched.
     * There are two types of progress events: ProgressEvent.PROGRESS and ProgressEvent.SOCKET_DATA.
     * @version Egret 2.4
     * @platform Web,Native
     */
    export class ProgressEvent extends egret.Event {

        /**
         * @language zh_CN
         * 加载进度发生变化
         */
        /**
         * Changes in the loading progress
         * @version Egret 2.4
         * @platform Web,Native
         */
        public static PROGRESS:string = "progress";

        /**
         * @language zh_CN
         * 获取到数据
         */
        /**
         * Get the data
         * @version Egret 2.4
         * @platform Web,Native
         */
        public static SOCKET_DATA:string = "socketData";

        /**
         * @language zh_CN
         * 在侦听器处理事件时加载的项数或字节数。
         */
        /**
         * Number of items or bytes when the listener processes the event.
         * @version Egret 2.4
         * @platform Web,Native
         */
        public bytesLoaded:number = 0;

        /**
         * @language zh_CN
         * 如果加载过程成功，将加载的总项数或总字节数。
         */
        /**
         * If the loading process succeeds, the total number or the total number of bytes that will be loaded term.
         * @version Egret 2.4
         * @platform Web,Native
         */
        public bytesTotal:number = 0;

        /**
         * @language zh_CN
         * 创建一个 egret.ProgressEvent 对象
         * @param type  事件的类型，可以作为 Event.type 访问。
         * @param bubbles  确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         * @param cancelable 确定是否可以取消 Event 对象。默认值为 false。
         * @param bytesLoaded 加载的项数或字节数
         * @param bytesTotal 加载的总项数或总字节数
         */
        /**
         * 创建一个 egret.ProgressEvent 对象
         * @param type  The type of the event, accessible as Event.type.
         * @param bubbles  Determines whether the Event object participates in the bubbling stage of the event flow. The default value is false.
         * @param cancelable Determines whether the Event object can be canceled. The default values is false.
         * @param bytesLoaded Number of items or bytes loaded
         * @param bytesTotal The total number of items or bytes loaded
         * @version Egret 2.4
         * @platform Web,Native
         */
        public constructor(type:string, bubbles:boolean = false, cancelable:boolean = false, bytesLoaded:number = 0, bytesTotal:number = 0) {
            super(type, bubbles, cancelable);

            this.bytesLoaded = bytesLoaded;
            this.bytesTotal = bytesTotal;
        }

        /**
         * @language zh_CN
         * 使用指定的EventDispatcher对象来抛出Event事件对象。抛出的对象将会缓存在对象池上，供下次循环复用。
         * @param target {egret.IEventDispatcher} 派发事件目标
         * @param type {string} 事件类型
         * @param bytesLoaded 加载的项数或字节数
         * @param bytesTotal 加载的总项数或总字节数
         */
        /**
         * EventDispatcher object using the specified event object thrown Event. The objects will be thrown in the object cache pool for the next round robin.
         * @param target {egret.IEventDispatcher} Distribute event target
         * @param type  The type of the event, accessible as Event.type.
         * @param bytesLoaded Number of items or bytes loaded
         * @param bytesTotal The total number of items or bytes loaded
         * @version Egret 2.4
         * @platform Web,Native
         */
        public static dispatchProgressEvent(target:IEventDispatcher, type:string, bytesLoaded:number = 0, bytesTotal:number = 0):boolean {
            let event:ProgressEvent = Event.create(ProgressEvent, type);
            event.bytesLoaded = bytesLoaded;
            event.bytesTotal = bytesTotal;
            let result = target.dispatchEvent(event);
            Event.release(event);
            return result;
        }
    }
}
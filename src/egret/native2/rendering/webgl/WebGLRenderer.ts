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

module egret.native2 {

    var blendModes = ["source-over", "lighter", "destination-out"];
    var defaultCompositeOp = "source-over";
    var BLACK_COLOR = "#000000";
    var CAPS_STYLES = { none: 'butt', square: 'square', round: 'round' };
    var renderBufferPool: WebGLRenderBuffer[] = [];//渲染缓冲区对象池
    /**
     * @private
     * WebGL渲染器
     */
    export class WebGLRenderer implements sys.SystemRenderer {

        public constructor() {

        }

        private nestLevel: number = 0;//渲染的嵌套层次，0表示在调用堆栈的最外层。
        /**
         * 渲染一个显示对象
         * @param displayObject 要渲染的显示对象
         * @param buffer 渲染缓冲
         * @param matrix 要对显示对象整体叠加的变换矩阵
         * @param dirtyList 脏矩形列表
         * @param forRenderTexture 绘制目标是RenderTexture的标志
         * @returns drawCall触发绘制的次数
         */
        public render(displayObject: DisplayObject, buffer: sys.RenderBuffer, matrix: Matrix, dirtyList?: egret.sys.Region[], forRenderTexture?: boolean): number {
            this.nestLevel++;
            var webglBuffer: WebGLRenderBuffer = <WebGLRenderBuffer>buffer;
            var webglBufferContext: WebGLRenderContext = webglBuffer.context;
            var root: DisplayObject = forRenderTexture ? displayObject : null;

            webglBufferContext.pushBuffer(webglBuffer);

            //绘制显示对象
            this.drawDisplayObject(displayObject, webglBuffer, dirtyList, matrix, null, null, root);
            webglBufferContext.$drawWebGL();
            var drawCall = webglBuffer.$drawCalls;
            webglBuffer.onRenderFinish();

            webglBufferContext.popBuffer();

            this.nestLevel--;
            if (this.nestLevel === 0) {
                //最大缓存6个渲染缓冲
                if (renderBufferPool.length > 6) {
                    renderBufferPool.length = 6;
                }
                var length = renderBufferPool.length;
                for (var i = 0; i < length; i++) {
                    renderBufferPool[i].resize(0, 0);
                }
            }
            return drawCall;
        }

        /**
         * @private
         * 绘制一个显示对象
         */
        private drawDisplayObject(displayObject: DisplayObject, buffer: WebGLRenderBuffer, dirtyList: egret.sys.Region[],
            matrix: Matrix, displayList: sys.DisplayList, clipRegion: sys.Region, root: DisplayObject): number {
            var drawCalls = 0;
            var node: sys.RenderNode;
            var filterPushed: boolean = false;
            if (displayList && !root) {
                if (displayList.isDirty) {
                    drawCalls += displayList.drawToSurface();
                }
                node = displayList.$renderNode;
            }
            else {
                node = displayObject.$getRenderNode();
            }

            if (node) {
                if (dirtyList) {
                    var renderRegion = node.renderRegion;
                    if (clipRegion && !clipRegion.intersects(renderRegion)) {
                        node.needRedraw = false;
                    }
                    else if (!node.needRedraw) {
                        var l = dirtyList.length;
                        for (var j = 0; j < l; j++) {
                            if (renderRegion.intersects(dirtyList[j])) {
                                node.needRedraw = true;
                                break;
                            }
                        }
                    }
                }
                else {
                    node.needRedraw = true;
                }
                if (node.needRedraw) {
                    drawCalls++;
                    var renderAlpha: number;
                    var m: Matrix;
                    if (root) {
                        renderAlpha = displayObject.$getConcatenatedAlphaAt(root, displayObject.$getConcatenatedAlpha());
                        m = Matrix.create().copyFrom(displayObject.$getConcatenatedMatrix());
                        displayObject.$getConcatenatedMatrixAt(root, m);
                        matrix.$preMultiplyInto(m, m);
                        buffer.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
                        Matrix.release(m);
                    }
                    else {
                        renderAlpha = node.renderAlpha;
                        m = node.renderMatrix;
                        buffer.setTransform(m.a, m.b, m.c, m.d, m.tx + matrix.tx, m.ty + matrix.ty);
                    }
                    buffer.globalAlpha = renderAlpha;
                    this.renderNode(node, buffer);
                    node.needRedraw = false;
                }
            }
            if (displayList && !root) {
                return drawCalls;
            }
            var children = displayObject.$children;
            if (children) {
                var length = children.length;
                for (var i = 0; i < length; i++) {
                    var child = children[i];
                    if (!child.$visible || child.$alpha <= 0 || child.$maskedObject) {
                        continue;
                    }
                    var filters = child.$getFilters();
                    if (filters && filters.length > 0) {
                        drawCalls += this.drawWithFilter(child, buffer, dirtyList, matrix, clipRegion, root);
                    }
                    else if ((child.$blendMode !== 0 ||
                        (child.$mask && (child.$mask.$parentDisplayList || root)))) {//若遮罩不在显示列表中，放弃绘制遮罩。
                        drawCalls += this.drawWithClip(child, buffer, dirtyList, matrix, clipRegion, root);
                    }
                    else if (child.$scrollRect || child.$maskRect) {
                        drawCalls += this.drawWithScrollRect(child, buffer, dirtyList, matrix, clipRegion, root);
                    }
                    else {
                        if (child["isFPS"]) {
                            buffer.context.$drawWebGL();
                            buffer.$computeDrawCall = false;
                            this.drawDisplayObject(child, buffer, dirtyList, matrix, child.$displayList, clipRegion, root);
                            buffer.context.$drawWebGL();
                            buffer.$computeDrawCall = true;
                        }
                        else {
                            drawCalls += this.drawDisplayObject(child, buffer, dirtyList, matrix,
                                child.$displayList, clipRegion, root);
                        }
                    }
                }
            }

            return drawCalls;
        }

        /**
         * @private
         */
        private drawWithFilter(displayObject: DisplayObject, buffer: WebGLRenderBuffer, dirtyList: egret.sys.Region[],
            matrix: Matrix, clipRegion: sys.Region, root: DisplayObject): number {
            var drawCalls = 0;
            var filters = displayObject.$getFilters();
            var hasBlendMode = (displayObject.$blendMode !== 0);
            if (hasBlendMode) {
                var compositeOp = blendModes[displayObject.$blendMode];
                if (!compositeOp) {
                    compositeOp = defaultCompositeOp;
                }
            }

            if (filters.length == 1 && filters[0].type == "colorTransform" && !displayObject.$children) {
                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(compositeOp);
                }

                buffer.context.$filter = <ColorMatrixFilter>filters[0];
                drawCalls += this.drawDisplayObject(displayObject, buffer, dirtyList, matrix,
                    displayObject.$displayList, clipRegion, root);
                buffer.context.$filter = null;

                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                }

                return drawCalls;
            }

            // 获取显示对象的链接矩阵
            var displayMatrix = Matrix.create();
            displayMatrix.copyFrom(displayObject.$getConcatenatedMatrix());

            // 获取显示对象的矩形区域
            var region: sys.Region;
            region = sys.Region.create();
            var bounds = displayObject.$getOriginalBounds();
            region.updateRegion(bounds, displayMatrix);

            // 为显示对象创建一个新的buffer
            // todo 这里应该计算 region.x region.y
            var displayBuffer = this.createRenderBuffer(region.width, region.height);
            displayBuffer.context.pushBuffer(displayBuffer);
            displayBuffer.setTransform(1, 0, 0, 1, -region.minX, -region.minY);
            var offsetM = Matrix.create().setTo(1, 0, 0, 1, -region.minX, -region.minY);

            drawCalls += this.drawDisplayObject(displayObject, displayBuffer, dirtyList, offsetM,
                displayObject.$displayList, region, root);

            Matrix.release(offsetM);
            displayBuffer.context.popBuffer();

            //绘制结果到屏幕
            if (drawCalls > 0) {

                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(compositeOp);
                }

                drawCalls++;
                buffer.globalAlpha = 1;
                buffer.setTransform(1, 0, 0, 1, region.minX + matrix.tx, region.minY + matrix.ty);
                // 绘制结果的时候，应用滤镜
                buffer.context.drawTargetWidthFilters(filters, displayBuffer);

                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                }

            }

            renderBufferPool.push(displayBuffer);
            sys.Region.release(region);
            Matrix.release(displayMatrix);

            return drawCalls;
        }

        /**
         * @private
         */
        private drawWithClip(displayObject: DisplayObject, buffer: WebGLRenderBuffer, dirtyList: egret.sys.Region[],
            matrix: Matrix, clipRegion: sys.Region, root: DisplayObject): number {
            var drawCalls = 0;
            var hasBlendMode = (displayObject.$blendMode !== 0);
            if (hasBlendMode) {
                var compositeOp = blendModes[displayObject.$blendMode];
                if (!compositeOp) {
                    compositeOp = defaultCompositeOp;
                }
            }

            var scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
            var mask = displayObject.$mask;
            var mask = displayObject.$mask;
            if (mask) {
                var maskRenderNode = mask.$getRenderNode();
                if (maskRenderNode) {
                    var maskRenderMatrix = maskRenderNode.renderMatrix;
                    //遮罩scaleX或scaleY为0，放弃绘制
                    if ((maskRenderMatrix.a == 0 && maskRenderMatrix.b == 0) || (maskRenderMatrix.c == 0 && maskRenderMatrix.d == 0)) {
                        return drawCalls;
                    }
                }
            }
            //if (mask && !mask.$parentDisplayList) {
            //    mask = null; //如果遮罩不在显示列表中，放弃绘制遮罩。
            //}

            //计算scrollRect和mask的clip区域是否需要绘制，不需要就直接返回，跳过所有子项的遍历。
            var maskRegion: sys.Region;
            var displayMatrix = Matrix.create();
            displayMatrix.copyFrom(displayObject.$getConcatenatedMatrix());
            if (displayObject.$parentDisplayList) {
                var displayRoot = displayObject.$parentDisplayList.root;
                var invertedMatrix: Matrix;
                if (displayRoot !== displayObject.$stage) {
                    displayObject.$getConcatenatedMatrixAt(displayRoot, displayMatrix);
                }
            }

            if (mask) {
                var bounds = mask.$getOriginalBounds();
                maskRegion = sys.Region.create();
                var m = Matrix.create();
                m.copyFrom(mask.$getConcatenatedMatrix());
                if (invertedMatrix) {
                    invertedMatrix.$preMultiplyInto(m, m);
                }
                maskRegion.updateRegion(bounds, m);
                Matrix.release(m);
            }
            var region: sys.Region;
            if (scrollRect) {
                region = sys.Region.create();
                region.updateRegion(scrollRect, displayMatrix);
            }
            if (region && maskRegion) {
                region.intersect(maskRegion);
                sys.Region.release(maskRegion);
            }
            else if (!region && maskRegion) {
                region = maskRegion;
            }
            if (region) {
                if (region.isEmpty() || (clipRegion && !clipRegion.intersects(region))) {
                    sys.Region.release(region);
                    Matrix.release(displayMatrix);
                    return drawCalls;
                }
            }
            else {
                region = sys.Region.create();
                bounds = displayObject.$getOriginalBounds();
                region.updateRegion(bounds, displayMatrix);
            }
            var found = false;
            if (!dirtyList) {//forRenderTexture
                found = true;
            }
            else {
                var l = dirtyList.length;
                for (var j = 0; j < l; j++) {
                    if (region.intersects(dirtyList[j])) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                sys.Region.release(region);
                Matrix.release(displayMatrix);
                return drawCalls;
            }

            //没有遮罩,同时显示对象没有子项
            if (!mask && (!displayObject.$children || displayObject.$children.length == 0)) {
                if (scrollRect) {
                    var m = displayMatrix;
                    buffer.setTransform(m.a, m.b, m.c, m.d, m.tx - region.minX, m.ty - region.minY);
                    buffer.context.pushMask(scrollRect);
                }
                //绘制显示对象
                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(compositeOp);
                }
                drawCalls += this.drawDisplayObject(displayObject, buffer, dirtyList, matrix,
                    displayObject.$displayList, region, null);
                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                }
                if (scrollRect) {
                    buffer.context.popMask();
                }
                sys.Region.release(region);
                Matrix.release(displayMatrix);
                return drawCalls;
            }
            else {
                //绘制显示对象自身，若有scrollRect，应用clip
                var displayBuffer = this.createRenderBuffer(region.width, region.height);
                // var displayContext = displayBuffer.context;
                displayBuffer.context.pushBuffer(displayBuffer);
                displayBuffer.setTransform(1, 0, 0, 1, -region.minX, -region.minY);
                var offsetM = Matrix.create().setTo(1, 0, 0, 1, -region.minX, -region.minY);

                drawCalls += this.drawDisplayObject(displayObject, displayBuffer, dirtyList, offsetM,
                    displayObject.$displayList, region, root);
                //绘制遮罩
                if (mask) {
                    //如果只有一次绘制或是已经被cache直接绘制到displayContext
                    //webgl暂时无法添加,因为会有边界像素没有被擦除
                    //var maskRenderNode = mask.$getRenderNode();
                    //if (maskRenderNode && maskRenderNode.$getRenderCount() == 1 || mask.$displayList) {
                    //    displayBuffer.context.setGlobalCompositeOperation("destination-in");
                    //    drawCalls += this.drawDisplayObject(mask, displayBuffer, dirtyList, offsetM,
                    //        mask.$displayList, region, root);
                    //}
                    //else {
                    var maskBuffer = this.createRenderBuffer(region.width, region.height);
                    maskBuffer.context.pushBuffer(maskBuffer);
                    maskBuffer.setTransform(1, 0, 0, 1, -region.minX, -region.minY);
                    offsetM = Matrix.create().setTo(1, 0, 0, 1, -region.minX, -region.minY);
                    var calls = this.drawDisplayObject(mask, maskBuffer, dirtyList, offsetM,
                        mask.$displayList, region, root);
                    maskBuffer.context.popBuffer();

                    if (calls > 0) {
                        drawCalls += calls;
                        displayBuffer.context.setGlobalCompositeOperation("destination-in");
                        displayBuffer.setTransform(1, 0, 0, -1, 0, maskBuffer.height);
                        displayBuffer.globalAlpha = 1;
                        var maskBufferWidth = maskBuffer.rootRenderTarget.width;
                        var maskBufferHeight = maskBuffer.rootRenderTarget.height;
                        displayBuffer.context.drawTexture(maskBuffer.rootRenderTarget.texture, 0, 0, maskBufferWidth, maskBufferHeight,
                            0, 0, maskBufferWidth, maskBufferHeight, maskBufferWidth, maskBufferHeight);
                        displayBuffer.context.setGlobalCompositeOperation("source-over");
                    }
                    renderBufferPool.push(maskBuffer);
                    //}
                }
                Matrix.release(offsetM);

                displayBuffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                displayBuffer.context.popBuffer();

                //绘制结果到屏幕
                if (drawCalls > 0) {
                    drawCalls++;
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(compositeOp);
                    }
                    if (scrollRect) {
                        var m = displayMatrix;
                        displayBuffer.setTransform(m.a, m.b, m.c, m.d, m.tx - region.minX, m.ty - region.minY);
                        displayBuffer.context.pushMask(scrollRect);
                    }
                    buffer.globalAlpha = 1;
                    buffer.setTransform(1, 0, 0, -1, region.minX + matrix.tx, region.minY + matrix.ty + displayBuffer.height);
                    var displayBufferWidth = displayBuffer.rootRenderTarget.width;
                    var displayBufferHeight = displayBuffer.rootRenderTarget.height;
                    buffer.context.drawTexture(displayBuffer.rootRenderTarget.texture, 0, 0, displayBufferWidth, displayBufferHeight,
                        0, 0, displayBufferWidth, displayBufferHeight, displayBufferWidth, displayBufferHeight);
                    if (scrollRect) {
                        displayBuffer.context.popMask();
                    }
                    if (hasBlendMode) {
                        buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                    }
                }

                renderBufferPool.push(displayBuffer);
                sys.Region.release(region);
                Matrix.release(displayMatrix);

                return drawCalls;
            }
        }

        /**
         * @private
         */
        private drawWithScrollRect(displayObject: DisplayObject, buffer: WebGLRenderBuffer, dirtyList: egret.sys.Region[],
            matrix: Matrix, clipRegion: sys.Region, root: DisplayObject): number {
            var drawCalls = 0;
            var scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
            if (scrollRect.width == 0 || scrollRect.height == 0) {
                return drawCalls;
            }
            var m = Matrix.create();
            m.copyFrom(displayObject.$getConcatenatedMatrix());
            if (root) {
                displayObject.$getConcatenatedMatrixAt(root, m);
            }
            else if (displayObject.$parentDisplayList) {
                var displayRoot = displayObject.$parentDisplayList.root;
                if (displayRoot !== displayObject.$stage) {
                    displayObject.$getConcatenatedMatrixAt(displayRoot, m);
                }
            }
            var region: sys.Region = sys.Region.create();
            if (!scrollRect.isEmpty()) {
                region.updateRegion(scrollRect, m);
            }
            if (region.isEmpty() || (clipRegion && !clipRegion.intersects(region))) {
                sys.Region.release(region);
                Matrix.release(m);
                return drawCalls;
            }
            var found = false;
            if (!dirtyList) {//forRenderTexture
                found = true;
            }
            else {
                var l = dirtyList.length;
                for (var j = 0; j < l; j++) {
                    if (region.intersects(dirtyList[j])) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                sys.Region.release(region);
                Matrix.release(m);
                return drawCalls;
            }

            //绘制显示对象自身
            buffer.setTransform(m.a, m.b, m.c, m.d, m.tx + matrix.tx, m.ty + matrix.ty);

            var context = buffer.context;
            var scissor = false;
            if(buffer.$hasScissor || m.b != 0 || m.c != 0) {// 有旋转的情况下不能使用scissor
                context.pushMask(scrollRect);
            } else {
                var x = scrollRect.x;
                var y = scrollRect.y;
                var w = scrollRect.width;
                var h = scrollRect.height;
                x = x * m.a + m.tx + matrix.tx;
                y = y * m.d + m.ty + matrix.ty;
                w = w * m.a;
                h = h * m.d;
                context.enableScissor(x, - y - h + buffer.height, w, h);
                scissor = true;
            }

            drawCalls += this.drawDisplayObject(displayObject, buffer, dirtyList, matrix, displayObject.$displayList, region, root);
            buffer.setTransform(m.a, m.b, m.c, m.d, m.tx + matrix.tx, m.ty + matrix.ty);

            if(scissor) {
                context.disableScissor();
            } else {
                context.popMask();
            }
            
            sys.Region.release(region);
            Matrix.release(m);
            return drawCalls;
        }

        /**
         * 将一个RenderNode对象绘制到渲染缓冲
         * @param node 要绘制的节点
         * @param buffer 渲染缓冲
         * @param matrix 要叠加的矩阵
         * @param forHitTest 绘制结果是用于碰撞检测。若为true，当渲染GraphicsNode时，会忽略透明度样式设置，全都绘制为不透明的。
         */
        public drawNodeToBuffer(node: sys.RenderNode, buffer: WebGLRenderBuffer, matrix: Matrix, forHitTest?: boolean): void {
            var webglBuffer: WebGLRenderBuffer = <WebGLRenderBuffer>buffer;

            //pushRenderTARGET
            webglBuffer.context.pushBuffer(webglBuffer);

            webglBuffer.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            this.renderNode(node, buffer, forHitTest);
            webglBuffer.context.$drawWebGL();
            webglBuffer.onRenderFinish();

            //popRenderTARGET
            webglBuffer.context.popBuffer();
        }

        /**
         * @private
         */
        private renderNode(node: sys.RenderNode, buffer: WebGLRenderBuffer, forHitTest?: boolean): void {
            switch (node.type) {
                case sys.RenderNodeType.BitmapNode:
                    this.renderBitmap(<sys.BitmapNode>node, buffer);
                    break;
                case sys.RenderNodeType.TextNode:
                    this.renderText(<sys.TextNode>node, buffer);
                    break;
                case sys.RenderNodeType.GraphicsNode:
                    this.renderGraphics(<sys.GraphicsNode>node, buffer, forHitTest);
                    break;
                case sys.RenderNodeType.GroupNode:
                    this.renderGroup(<sys.GroupNode>node, buffer);
                    break;
                case sys.RenderNodeType.SetAlphaNode:
                    buffer.globalAlpha = node.drawData[0];
                    break;
                case sys.RenderNodeType.MeshNode:
                    this.renderMesh(<sys.MeshNode>node, buffer);
                    break;
            }
        }

        /**
         * @private
         */
        private renderBitmap(node: sys.BitmapNode, buffer: WebGLRenderBuffer): void {
            var image = node.image;
            if(!image) {
                return;
            }
            //buffer.imageSmoothingEnabled = node.smoothing;
            var data = node.drawData;
            var length = data.length;
            var pos = 0;
            var m = node.matrix;
            var blendMode = node.blendMode;
            var alpha = node.alpha;
            if (m) {
                buffer.saveTransform();
                buffer.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            }
            //这里不考虑嵌套
            if (blendMode) {
                buffer.context.setGlobalCompositeOperation(blendModes[blendMode]);
            }
            if(alpha == alpha) {
                var originAlpha = buffer.globalAlpha;
                buffer.globalAlpha *= alpha;
            }
            if(node.filter) {
                buffer.context.$filter = node.filter;
                while (pos < length) {
                    buffer.context.drawImage(image, data[pos++], data[pos++], data[pos++], data[pos++],
                        data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight);
                }
                buffer.context.$filter = null;
            }
            else {
                while (pos < length) {
                    buffer.context.drawImage(image, data[pos++], data[pos++], data[pos++], data[pos++],
                        data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight);
                }
            }
            if (blendMode) {
                buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
            }
            if(alpha == alpha) {
                buffer.globalAlpha = originAlpha;
            }
            if (m) {
                buffer.restoreTransform();
            }
        }

        /**
         * @private
         */
        private renderMesh(node: sys.MeshNode, buffer: WebGLRenderBuffer): void {
            var image = node.image;
            //buffer.imageSmoothingEnabled = node.smoothing;
            var data = node.drawData;
            var length = data.length;
            var pos = 0;
            var m = node.matrix;
            if (m) {
                buffer.saveTransform();
                buffer.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
            }
            while (pos < length) {
                buffer.context.drawMesh(image, data[pos++], data[pos++], data[pos++], data[pos++],
                    data[pos++], data[pos++], data[pos++], data[pos++], node.imageWidth, node.imageHeight, node.uvs, node.vertices, node.indices, node.bounds);
            }
            if (m) {
                buffer.restoreTransform();
            }
        }

        private canvasRenderer: CanvasRenderer;
        private canvasRenderBuffer: CanvasRenderBuffer;

        /**
         * @private
         */
        private renderText(node: sys.TextNode, buffer: WebGLRenderBuffer): void {
            // lj
            // console.log(" +++++++++++++++++++++++++++++++++++++++ - ");
            // console.log("textAlign\t " + node["textAlign"]);
            // console.log("width\t " + node["textFieldWidth"]);
            // console.log("height\t " + node["textFieldHeight"]);
            // console.log(" +++++++++++++++++++++++++++++++++++++++ = " + node.drawData.length);

            // context.textAlign = "left";
            // context.textBaseline = "middle";
            // context.lineJoin = "round"; //确保描边样式是圆角

            var canvasW = 2;
            var canvasH = 2;
            while (canvasW < node.width) {
                canvasW *= 2;
            }
            while (canvasH < node.height) {
                canvasH *= 2;
            }
            egret_native.Skia.createCanvas(canvasW, canvasH, node.x, node.y);

            var drawData = node.drawData;
            var length = drawData.length;
            var pos = 0;
            while (pos < length) {
                var x = drawData[pos++];
                var y = drawData[pos++];
                var text = drawData[pos++];
                var format = drawData[pos++];
                // context.font = getFontString(node, format);
                var textColor = format.textColor == null ? node.textColor : format.textColor;
                var strokeColor = format.strokeColor == null ? node.strokeColor : format.strokeColor;
                var stroke = format.stroke == null ? node.stroke : format.stroke;
                var size = format.size == null ? node.size : format.size;
                // context.fillStyle = egret.toColorString(textColor);
                // context.strokeStyle = egret.toColorString(strokeColor);
                // if (stroke) {
                    // context.lineWidth = stroke * 2;
                    // context.strokeText(text, x, y);
                // }

                egret_native.Skia.setTextSize(size);
                var color = textColor;
                if (color < 0x1000000)
                {
                    color |= (0xff000000);
                }
                egret_native.Skia.setColor(color);
                egret_native.Skia.drawText(text, x, y + size / 2);

                // context.fillText(text, x, y);
                // egret_native.Label.createLabel("", size, "", stroke);

                // var transformDirty = false;

                // if (x != 0 || y != 0) {
                //     transformDirty = true;
                //     buffer.saveTransform();
                //     buffer.transform(1, 0, 0, 1, x, y);
                // }

                // buffer.context.drawText(text, size, 0, 0, textColor, stroke, strokeColor);

                // if (transformDirty) {
                //     buffer.restoreTransform();
                // }
            }

            var t = egret_native.Skia.getRenderTexture();
            buffer.context.drawGraphics(t, canvasW, canvasH, node.width, node.height, node.renderAlpha);

            // egret_native.Label.createLabel("", node.size, "", node.stroke);

            // var width = node.width - node.x;
            // var height = node.height - node.y;

            // var textFieldWidth = node["textFieldWidth"];
            // var textFieldHeight = node["textFieldHeight"];

            // var dx = 0;
            // var dy = 0;
            // var textSize = egret_native.Label.getTextSize(node["text"]);
            // var textWidth = textSize[0];
            // var textHeight = textSize[1];

            // var transformDirty = false;

            // if (node["textAlign"] == "right" && textFieldWidth) {
            //     dx = textFieldWidth - textWidth;
            // }
            // else if (node["textAlign"] == "center" && textFieldWidth) {
            //     dx =  (textFieldWidth - textWidth) / 2;
            // }

            // if (node["verticalAlign"] == "bottom" && textFieldHeight) {
            //     dy = textFieldHeight - textHeight;
            // }
            // else if (node["verticalAlign"] == "middle" && textFieldHeight) {
            //     dy = (textFieldHeight - textHeight) / 2;
            // }

            // if (dx != 0 || dy != 0) {
            //     transformDirty = true;
            //     console.log(dx + " " + dy);
            //     buffer.transform(1, 0, 0, 1, dx, dy);
            // }

            // buffer.context.drawText(node["text"], node.size, 0, 0, node["textColor"], node.stroke, node.strokeColor);

            // if (transformDirty) {
            //     buffer.restoreTransform();
            // }

            // console.log(" +++++++++++++++++++++++++++++++++++++++ render text end ");
            //-lj
            
        }

        /**
         * @private
         */
        private renderGraphics(node: sys.GraphicsNode, buffer: WebGLRenderBuffer, forHitTest?: boolean): void {

            var canvasW = 2;
            var canvasH = 2;
            while (canvasW < node.width) {
                canvasW *= 2;
            }
            while (canvasH < node.height) {
                canvasH *= 2;
            }
            egret_native.Skia.createCanvas(canvasW, canvasH, node.x, node.y);

            var drawData = node.drawData;
            // egret_native.Skia.setColor(0xff00ffff);
            for (var i = 0; i < drawData.length; i++) {
                var color = 0
                // console.log(">>>>>>>>" + color);
                if (drawData[i].fillColor) {
                    color = drawData[i].fillColor;
                    if (color < 0x1000000)
                    {
                        color |= (0xff000000);
                    }
                    egret_native.Skia.setColor(color);
                }
                else if (drawData[i].lineColor) {
                    color = drawData[i].lineColor;
                    if (color < 0x1000000)
                    {
                        color |= 0x88000000;
                    }
                    egret_native.Skia.setColor(color);
                    egret_native.Skia.setStrokeWidth(drawData[i].lineWidth);
                }
                else {
                    egret_native.Skia.setColor(0);
                }
                // console.log(">>>>>>>>" + color);
                egret_native.Skia.pushDrawData(drawData[i].type, drawData[i].$commands, drawData[i].$data,
                    drawData[i].commandPosition, drawData[i].dataPosition);
            }

            // egret_native.Skia.setColor(0xff0000ff);
            // egret_native.Skia.drawRect(0, 0, 50, 50);
            var t = egret_native.Skia.getRenderTexture();
            buffer.context.drawGraphics(t, canvasW, canvasH, node.width, node.height, node.renderAlpha);

            // change xs
                // skip graphics render
                // TODO
                return;
            // change end

            var width = node.width;
            var height = node.height;
            if (width <= 0 || height <= 0 || !width || !height || node.drawData.length == 0) {
                return;
            }
            if (!this.canvasRenderBuffer || !this.canvasRenderBuffer.context) {
                this.canvasRenderer = new CanvasRenderer();
                this.canvasRenderBuffer = new CanvasRenderBuffer(width, height);
            }
            else if (node.dirtyRender || forHitTest) {
                this.canvasRenderBuffer.resize(width, height);
            }
            if (!this.canvasRenderBuffer.context) {
                return;
            }
            if (node.x || node.y) {
                if (node.dirtyRender || forHitTest) {
                    this.canvasRenderBuffer.context.translate(-node.x, -node.y);
                }
                buffer.transform(1, 0, 0, 1, node.x, node.y);
            }
            var surface = this.canvasRenderBuffer.surface;
            if (forHitTest) {
                this.canvasRenderer.renderGraphics(node, this.canvasRenderBuffer.context, true);
                WebGLUtils.deleteWebGLTexture(surface);
                var texture = buffer.context.getWebGLTexture(<BitmapData><any>surface);
                buffer.context.drawTexture(texture, 0, 0, width, height, 0, 0, width, height, surface.width, surface.height);
            } else {
                if (node.dirtyRender) {
                    this.canvasRenderer.renderGraphics(node, this.canvasRenderBuffer.context);

                    // 拷贝canvas到texture
                    var texture: WebGLTexture = node.$texture;
                    if (!texture) {
                        texture = buffer.context.createTexture(<BitmapData><any>surface);
                        node.$texture = texture;
                    } else {
                        // 重新拷贝新的图像
                        buffer.context.updateTexture(texture, <BitmapData><any>surface);
                    }
                    // 保存材质尺寸
                    node.$textureWidth = surface.width;
                    node.$textureHeight = surface.height;
                }
                var textureWidth = node.$textureWidth;
                var textureHeight = node.$textureHeight;
                buffer.context.drawTexture(node.$texture, 0, 0, textureWidth, textureHeight, 0, 0, textureWidth, textureHeight, textureWidth, textureHeight);
            }

            if (node.x || node.y) {
                if (node.dirtyRender || forHitTest) {
                    this.canvasRenderBuffer.context.translate(node.x, node.y);
                }
                buffer.transform(1, 0, 0, 1, -node.x, -node.y);
            }
            if (!forHitTest) {
                node.dirtyRender = false;
            }
        }

        private renderGroup(groupNode: sys.GroupNode, buffer: WebGLRenderBuffer): void {
            var children = groupNode.drawData;
            var length = children.length;
            for (var i = 0; i < length; i++) {
                var node: sys.RenderNode = children[i];
                this.renderNode(node, buffer);
            }
        }

        /**
         * @private
         */
        private createRenderBuffer(width: number, height: number): WebGLRenderBuffer {
            var buffer = renderBufferPool.pop();
            if (buffer) {
                buffer.resize(width, height);
            }
            else {
                buffer = new WebGLRenderBuffer(width, height);
                buffer.$computeDrawCall = false;
            }
            return buffer;
        }
    }
}

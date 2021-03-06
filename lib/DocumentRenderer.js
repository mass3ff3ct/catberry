/*
 * catberry
 *
 * Copyright (c) 2014 Denis Rechkunov and project contributors.
 *
 * catberry's license follows:
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * This license applies to all parts of catberry that are not externally
 * maintained libraries.
 */

'use strict';

module.exports = DocumentRenderer;

var util = require('util'),
	moduleHelper = require('./helpers/moduleHelper'),
	DocumentRendererBase = require('./base/DocumentRendererBase'),
	ComponentReadable = require('./streams/ComponentReadable');

util.inherits(DocumentRenderer, DocumentRendererBase);

/**
 * Creates new instance of document renderer.
 * @param {ServiceLocator} $serviceLocator Locator to resolve dependencies.
 * @constructor
 * @extends DocumentRendererBase
 */
function DocumentRenderer($serviceLocator) {
	DocumentRendererBase.call(this, $serviceLocator);
}

/**
 * Renders response on request with specified state and routing context.
 * @param {Object} state State of the application.
 * @param {Object} routingContext Routing Context.
 */
DocumentRenderer.prototype.render = function (state, routingContext) {
	var self = this;
	this._getPromiseForReadyState()
		.then(function () {
			var renderingContext = {
				isDocumentRendered: false,
				isHeadRendered: false,
				config: self._serviceLocator.resolve('config'),
				renderedIds: Object.create(null),
				routingContext: routingContext,
				storeDispatcher: self._serviceLocator
					.resolve('storeDispatcher'),
				logger: self._serviceLocator
					.resolve('logger'),
				eventBus: self._eventBus,
				components: self._componentLoader.getComponentsByNames()
			};
			renderingContext.storeDispatcher.setState(state, routingContext);

			var renderStream = new ComponentReadable(renderingContext);

			renderStream.renderDocument();
			renderStream
				.pipe(routingContext.middleware.response)
				.on('finish', function () {
					self._eventBus.emit('documentRendered', routingContext);
				});
		})
		.catch(function (reason) {
			self._eventBus.emit('error', reason);
		});
};
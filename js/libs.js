/**
 * Terrific JavaScript Framework v1.1.1
 * http://terrifically.org
 *
 * Copyright 2012, Remo Brunschwiler
 * MIT Licensed.
 *
 * Date: Thu, 10 May 2012 12:32:39 GMT
 *
 *
 * Includes:
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 *
 * @module Tc
 * 
 */

var Tc = Tc || {};

/*
 * The jQuery object.
 */
Tc.$ = jQuery.noConflict(false);

/**
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 *
 */
(function(){
    var initializing = false, fnTest = /xyz/.test(function() { xyz; }) ? /\b_super\b/ : /.*/;
    
    // The base Class implementation (does nothing)
    this.Class = function(){
    };
    
    // Create a new Class that inherits from this class
    Class.extend = function(prop){
        var _super = this.prototype;
        
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" &&
            fnTest.test(prop[name]) ? (function(name, fn){
                return function(){
                    var tmp = this._super;
                    
                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];
                    
                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }
        
        // The dummy class constructor
        function Class(){
            // All construction is actually done in the init method
            if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
        }
        
        // Populate our constructed prototype object
        Class.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        
        // And make this class extendable
        Class.extend = arguments.callee;
        
        return Class;
    };
})();

/**
 * Contains the application base config.
 * The base config can be extended or overwritten either via
 * new Application ($ctx, config), during bootstrapping the application or via 
 * /public/js/Tc.Config.js in the project folder.
 *
 * @author Remo Brunschwiler
 * @namespace Tc
 * @class Config
 * @static
 */
Tc.Config = {
    /** 
     * The paths for the different types of dependencies.
     *
     * @property dependencyPath
     * @type Object
     */
    dependencyPath: {
        library: '/js/libraries/dynamic/',
        plugin: '/js/plugins/dynamic/',
        util: '/js/utils/dynamic/'
    }
};

(function($) {
    "use strict";

    /**
     * Responsible for application-wide issues such as the creation of modules.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Application
     */
    Tc.Application = Class.extend({

        /**
         * Initializes the application.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {jQuery} $ctx 
         *      The jquery context
         * @param {Object} config 
         *      The configuration
         */
        init: function($ctx, config) {
            /**
             * The configuration.
             *
             * @property config
             * @type Object
             */
            this.config = $.extend(Tc.Config, config);

            /**
             * The jQuery context.
             *
             * @property $ctx
             * @type jQuery
             */
            this.$ctx = $ctx || $('body');

            /**
             * Contains references to all modules on the page. This can, for
             * example, be useful when there are interactions between Flash
             * objects and Javascript.
             *
             * @property modules
             * @type Array
             */
            this.modules = [];

            /**
             * Contains references to all connectors on the page.
             *
             * @property connectors
             * @type Object
             */
            this.connectors = {};

            /**
             * Contains references to all wildcard components on the page.
             *
             * @property wildcardComponents
             * @type Array
             */
            this.wildcardComponents = [];

            /**
             * The sandbox to get the resources from 
             * This sandbox is shared between all modules.
             *
             * @property sandbox
             * @type Sandbox
             */
            this.sandbox = new Tc.Sandbox(this, this.config);
        },

        /**
         * Register modules withing scope
         * Automatically registers all modules within the scope, 
         * as long as the modules use the OOCSS naming conventions.
         *
         * @method registerModules
         * @param {jQuery} $ctx 
         *      The jQuery context.
         * @return {Array} 
         *      A list containing the references of the registered modules.
         */
        registerModules : function($ctx) {
            var that = this,
                modules = [];

            $ctx = $ctx || this.$ctx;

            $ctx.find('.mod').each(function() {
                var $this = $(this);

                /**
                 * Indicates that it is a base module, this is the default and
                 * no JavaScript needs to be involved. It must occur excactly
                 * once.
                 * @config .mod 
                 */

                /**
                 * Indicates that it is a module of type basic, which is
                 * derived from the base module. It can occur at most
                 * once. Example: .modBasic
                 * @config .mod{moduleName}
                 */

                /**
                 * Indicates that the module basic has the submarine skin. It
                 * will be decorated by the skin JS (if it exists). It can occur
                 * arbitrarily. Example: .skinBasicSubmarine
                 * @config .skin{moduleName}{skinName} 
                 */

                /** 
                 * A module can have a comma-separated list of data connectors.
                 * The list contains the IDs of the connectors in the following
                 * schema: {connectorName}{connectorId}{connectorRole}
                 * 
                 * The example MasterSlave1Master decodes to: name = 
                 * MasterSlave, id = 1, role = Master. This indicates that the
                 * module should notify the MasterSlave connector (the mediator)
                 * on all state changes. The connector id is used to chain the
                 * appropriate modules together and to improve the
                 * reusability of the connector. It can contain multiple
                 * connector ids (e.g. 1,2,MasterSlave1Master). 
                 *
                 * @config data-connectors
                 */

                var classes = $this.attr('class').split(' ');

                if (classes.length > 1) {
                    var modName,
                        skins = [],
                        connectors = [];

                    for (var i = 0, len = classes.length; i < len; i++) {
                        var part = $.trim(classes[i]);

                        if (part.indexOf('mod') === 0 && part.length > 3) {
                            modName = part.substr(3);
                        }
                        else if (part.indexOf('skin') === 0) {
                            // Remove the mod name part from the skin name
                            skins.push(part.substr(4).replace(modName, ''));
                        }
                    }

                    if ($this.attr('data-connectors')) {
                        connectors = $this.attr('data-connectors').split(',');
                        for (var i = 0, len = connectors.length; i < len; i++) {
                            var connector = $.trim(connectors[i]);
                            if(connector) {
                                connectors[i] = connector;
                            }
                        }
                    }

                    if (modName && Tc.Module[modName]) {
                        modules.push(that.registerModule($this, modName, skins, connectors));
                    }
                }
            });

            return modules;
        },

        /**
         * Unregisters the modules given by the module instances.
         *
         * @method unregisterModule
         * @param {Array} modules 
         *      A list containting the module instances to unregister
         * @return {void}
         */
        unregisterModules : function(modules) {
            var connectors = this.connectors,
                wildcardComponents = this.wildcardComponents;

            modules = modules || this.modules;

            if (modules === this.modules) {
                // Empty everything if the arrays are equal
                this.wildcardComponents = [];
                this.connectors = [];
                this.modules = [];
            }
            else {
                // Unregister the given modules
                for (var i = 0, len = modules.length; i < len; i++) {
                    var module = modules[i];
                    var index;

                    // Delete the references in the connectors
                    for (var connectorId in connectors) {
                        if (connectors.hasOwnProperty(connectorId)) {
                            connectors[connectorId].unregisterComponent(module);
                        }
                    }

                    // Delete the references in the wildcard components
                    index = $.inArray(module, wildcardComponents);
                    if(index > -1) {
                        delete wildcardComponents[index];
                    }

                    // Delete the module instance itself
                    index = $.inArray(module, this.modules);
                    if(index > -1) {
                        delete this.modules[index];
                    }
                }
            }
        },

        /**
         * Starts (intializes) the registered modules.
         *
         * @method start
         * @param {Array} modules 
         *      A list of the modules to start
         * @return {void}
         */
        start: function(modules) {
            var wildcardComponents = this.wildcardComponents,
                connectors = this.connectors;

            modules = modules || this.modules;

            // Start the modules
            for (var i = 0, len = modules.length; i < len; i++) {
                modules[i].start();
            }

            /*
             * Special treatment for the wildcard connection (conn*) -> it will
             * be notified about all state changes from all connections and is
             * able to propagate its changes to all modules. This must be done on
             * init to make sure that all connectors on the page has been
             * instantiated. Only do this for the given modules.
             */
            for (var i = 0, len = wildcardComponents.length; i < len; i++) {
                var component = wildcardComponents[i];
                if ($.inArray(component, modules) > -1) {
                    for (var connectorId in connectors) {
                        if (connectors.hasOwnProperty(connectorId)) {
                            // The connector observes the component and attaches it as an observer
                            component.attachConnector(connectors[connectorId]);
                            connectors[connectorId].registerComponent(component, '*');
                        }
                    }
                }
            }
        },

        /**
         * Stops the registered modules.
         *
         * @method stop
         * @param {Array} modules 
         *      A list containting the module instances to stop.
         * @return {void}
         */
        stop: function(modules) {
            modules = modules || this.modules;

            // Stop the modules
            for (var i = 0, len = modules.length; i < len; i++) {
                modules[i].stop();
            }
        },

        /**
         * Registers a module.
         *
         * @method registerModule
         * @param {jQuery} $node 
         *      The module node.
         * @param {String} modName 
         *      The module name. It must match the class name of the module
         *      (case sensitive).
         * @param {Array} skins 
         *      A list of skin names. Each entry must match a class name of a
         *      skin (case sensitive).
         * @param {Array} connectors 
         *      A list of connectors identifiers (e.g. MasterSlave1Master).
         *      Schema: {connectorName}{connectorId}{connectorRole}
         * @return {Module} 
         *      The reference to the registered module.
         */
        registerModule : function($node, modName, skins, connectors) {
            var modules = this.modules;

            modName = modName || null;
            skins = skins || [];
            connectors = connectors || [];

            if (modName && Tc.Module[modName]) {
                // Generate a unique ID for every module
                var modId = modules.length;
                $node.data('id', modId);

                modules[modId] = new Tc.Module[modName]($node, this.sandbox, modId);

                for (var i = 0, len = skins.length; i < len; i++) {
                    var skinName = skins[i];

                    if (Tc.Module[modName][skinName]) {
                        modules[modId] = modules[modId].getDecoratedModule(modName, skinName);
                    }
                }

                for (var i = 0, len = connectors.length; i < len; i++) {
                    this.registerConnection(connectors[i], modules[modId]);
                }

                return modules[modId];
            }

            return null;
        },

        /**
         * Registers a connection between a module and a connector.
         *
         * @method registerConnection
         * @param {String} connector 
         *      The full connector name (e.g. MasterSlave1Slave).
         * @param {Module} component 
         *      The module instance.
         * @return {void}
         */
        registerConnection : function(connector, component) {
            var connectorType = connector.replace(/[0-9]+[a-zA-Z]*$/, ''),
                connectorId = connector.replace(/[a-zA-Z]*$/, '').replace(/^[a-zA-Z]*/, ''),
                connectorRole = connector.replace(/^[a-zA-Z]*[0-9]*/, '');

            if(connectorId) {
                if (connectorId === '*' && connectorRole === '*') {
                    // Add the component to the wildcard component stack
                    this.wildcardComponents.push(component);
                }
                else {
                    var connectors = this.connectors;

                    if (!connectors[connectorId]) {
                        // Instantiate the appropriate connector if it does not
                // exist yet
                        if (connectorType === '') {
                            connectors[connectorId] = new Tc.Connector(connectorId);
                        }
                        else if (Tc.Connector[connectorType]) {
                            connectors[connectorId] = new Tc.Connector[connectorType](connectorId);
                        }
                    }

                    if (connectors[connectorId]) {
                        /**
                         * The connector observes the component and attaches it as
                         * an observer.
                         */
                        component.attachConnector(connectors[connectorId]);

                        /**
                         * The component wants to be informed over state changes.
                         * It registers it as connector member.
                         */
                        connectors[connectorId].registerComponent(component, connectorRole);
                    }
                }
            }
        },

        /**
         * Unregisters a module from a connector.
         *
         * @method unregisterConnection
         * @param {int} connectorId
         *      The connector channel id (e.g. 2).
         * @param {Module} component
         *      The module instance.
         * @return {void}
         */
        unregisterConnection : function(connectorId, component) {
            var wildcardComponents = this.wildcardComponents,
                connectors = this.connectors,
                connector = connectors[connectorId];

            // Delete the references in the connector and the module
            if (connector) {
                connector.unregisterComponent(component);
                component.detachConnector(connector);
            }

            // Delete the references in the wildcard components
            var index = $.inArray(component, wildcardComponents);
            if(index > -1) {
                delete wildcardComponents[index];
            }
        }
    });
})(Tc.$);

(function($) {
    "use strict";

    /**
     * The sandbox function
     * The sandbox is used as a central point to get resources from, grant
     * permissions, etc.  It is shared between all modules.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Sandbox
     */
    Tc.Sandbox = Class.extend({

        /**
         * Initializes the Sandbox.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {Applicaton} application 
         *      The application reference
         * @param {Object} config 
         *      The configuration
         */
        init : function(application, config) {

            /**
             * The application
             *
             * @property application
             * @type Application
             */
            this.application = application;

            /**
             * The configuration.
             *
             * @property config
             * @type Object
             */
            this.config = config;

            /**
             * Contains the requested javascript dependencies.
             *
             * @property dependencies
             * @type Array
             */
            this.dependencies = [];

            /**
             * Contains the afterBinding module callbacks.
             *
             * @property afterBindingCallbacks
             * @type Array
             */
            this.afterBindingCallbacks = [];


            /**
             * Contains the first script node on the page.
             *
             * @property firstScript
             * @type Node
             */
            this.firstScript = $('script').get(0);
        },

        /**
         * Adds (register and start) all modules in the given context scope.
         *
         * @method addModules
         * @param {jQuery} $ctx 
         *      The jQuery context.
         * @return {Array} 
         *      A list containing the references of the registered modules.
         */
        addModules: function($ctx) {
            var modules = [],
                    application = this.application;

            if ($ctx) {
                // Register modules
                modules = application.registerModules($ctx);

                // Start modules
                application.start(modules);
            }

            return modules;
        },

        /**
         * Removes a module by module instances.
         * This stops and unregisters a module through a module instance.
         *
         * @method removeModules
         * @param {Array} modules 
         *      A list containting the module instances to remove.
         * @return {void}
         */
        removeModules: function(modules) {
            var application = this.application;

            if (modules) {
                // Stop modules
                application.stop(modules);

                // Unregister modules
                application.unregisterModules(modules);
            }
        },

        /**
         * Subscribes a module to a connector.
         *
         * @method subscribe
         * @param {String} connector
         *      The full connector name (e.g. MasterSlave1Slave).
         * @param {Module} module
         *      The module instance.
         * @return {void}
         */
        subscribe : function(connector, module) {
            var application = this.application;

            if(module instanceof Tc.Module && connector) {
                // explicitly cast connector to string
                connector = connector + '';

                application.registerConnection(connector, module);
            }
        },

        /**
         * Unsubscribes a module from a connector.
         *
         * @method unsubscribe
         * @param {int} connectorId
         *      The connector channel id (e.g. 2).
         * @param {Module} module
         *      The module instance.
         * @return {void}
         */
        unsubscribe : function(connectorId, module) {
            var application = this.application;

            if(module instanceof Tc.Module && connectorId) {
                // explicitly cast connector id to int
                connectorId = parseInt(connectorId)

                application.unregisterConnection(connectorId, module);
            }
        },

        /**
         * Gets the appropriate module for the given ID.
         *
         * @method getModuleById
         * @param {int} id 
         *      The module ID
         * @return {Module} 
         *      The appropriate module
         */
        getModuleById: function(id) {
            var application = this.application;

            if (application.modules[id] !== undefined) {
                return application.modules[id];
            }
            else {
                throw new Error('the module with the id ' + id + 
                                ' does not exist');
            }
        },

        /**
         * Gets the application config.
         *
         * @method getConfig
         * @return {Object} 
         *      The configuration object
         */
        getConfig: function() {
            return this.config;
        },

        /**
         * Gets an application config param.
         *
         * @method getConfigParam
         * @param {String} name 
         *      The param name
         * @return {mixed} 
         *      The appropriate configuration param
         */
        getConfigParam: function(name) {
            var config = this.config;

            if (config.name !== undefined) {
                return config.name;
            }
            else {
                throw new Error('the config param ' + name + ' does not exist');
            }
        },

        /**
         * Loads a requested dependency (if not already loaded).
         *
         * @method loadDependency
         * @param {String} dependency 
         *      The dependency (e.g. swfobject.js)
         * @param {String} type 
         *      The dependency type (plugin | library | util | url)
         * @param {Function} callback 
         *      The callback to execute after the dependency has successfully
         *      loaded.
         * @param {String} phase 
         *      The module phase where the dependency is needed
         *      (e.g. beforeBinding, onBinding).
         * @return {void}
         */
        loadDependency: function(dependency, type, callback, phase) {
            var that = this;
            // None indicates that it is not a dependency for a specific phase

            phase = phase || 'none';             
            type = type || 'plugin';

            if (that.dependencies[dependency] && 
            that.dependencies[dependency].state === 'requested') { 
                /**
                 * Requested (but loading ist not finished) the module should
                 * be notified, if the dependency has loaded
                 */
                that.dependencies[dependency].callbacks.push(function() {
                    callback(phase);
                });
            }
            else if (that.dependencies[dependency] && 
            that.dependencies[dependency].state === 'loaded') { 
                // Loading finished
                callback(phase);
            }
            else {
                that.dependencies[dependency] = {
                    state: 'requested',
                    callbacks: []
                };

                var path;

                switch (type) {
                    case 'library':
                    case 'plugin':
                    case 'util':
                        path = this.config.dependencyPath[type];
                        break;
                    case 'url':
                        path = '';
                        break;
                    case 'default':
                        path = '';
                        break;
                }

                // Load the appropriate dependency
                var script = document.createElement('script'),
                    firstScript = this.firstScript;
                
                script.src = path + dependency;

                script.onreadystatechange = script.onload = function () {
                    var readyState = script.readyState;
                    if (!readyState || readyState == 'loaded' 
                    || readyState == 'complete') {
                        that.dependencies[dependency].state = 'loaded';
                        callback(phase);

                        // Notify the other modules with this dependency
                        var callbacks = that.dependencies[dependency].callbacks;
                        for (var i = 0, len = callbacks.length; i < len; i++) {
                            callbacks[i]();
                        }

                        // Handle memory leak in IE
                        script.onload = script.onreadystatechange = null;
                    }
                };

                firstScript.parentNode.insertBefore(script, firstScript);
            }
        },

        /**
         * Collects the module status messages and handles the callbacks.
         * This means that it is ready for afterBinding.
         *
         * @method readyForAfterBinding
         * @param {Function} callback 
         *      The afterBinding module callback
         * @return {void}
         */
        readyForAfterBinding: function(callback) {
            var afterBindingCallbacks = this.afterBindingCallbacks;

            // Add the callback to the stack
            afterBindingCallbacks.push(callback);

            // Check whether all modules are ready for the afterBinding phase
            if (this.application.modules.length == afterBindingCallbacks.length) {
                for (var i = 0; i < afterBindingCallbacks.length; i++) {
                    afterBindingCallbacks[i]();
                }
            }
        }
    });
})(Tc.$);

(function($) {
    "use strict";

    /**
     * Base class for the different modules.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Module
     */
    Tc.Module = Class.extend({

        /**
         * Initializes the Module.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {jQuery} $ctx 
         *      The jQuery context
         * @param {Sandbox} sandbox 
         *      The sandbox to get the resources from
         * @param {String} modId 
         *      The Unique module ID
         */
        init: function($ctx, sandbox, modId) {
            /**
             * Contains the module context.
             *
             * @property $ctx
             * @type jQuery
             */
            this.$ctx = $ctx;

            /**
             * Contains the unique module ID.
             *
             * @property modId
             * @type String
             */
            this.modId = modId;

            /**
             * Contains the attached connectors.
             *
             * @property connectors
             * @type Array
             */
            this.connectors = [];

            /**
             * Contains the dependency counter for the different phases.
             *
             * @property dependencyCounter
             * @type Object
             */
            this.dependencyCounter = {
                beforeBinding: 0,
                /**
                 * The following counters have to be at least zero, so that
                 * the onBinding callback is loaded as a dependency for
                 * onBinding and the onBinding phase is completed for 
                 * afterBinding.
                 */
                onBinding: 1,
                afterBinding: 1 
            };

            /**
             * The sandbox to get the resources from.
             *
             * @property sandbox
             * @type Sandbox
             */
            this.sandbox = sandbox;
        },

        /**
         * Template method to start (i.e. init) the module.
         * This method provides hook functions which can be overridden
         * by the individual instance.
         *
         * @method start
         * @return {void}
         */
        start: function() {
            // Call the hook method dependencies from the individual instance
            if (this.dependencies) {
                this.dependencies();
            }

            this.initBeforeBinding();
        },

        /**
         * Template method to stop the module.
         *
         * @method stop
         * @return {void}
         */
        stop: function() {
            var $ctx = this.$ctx;
            
            // Remove all bound events and associated jQuery data
            $('*', $ctx).unbind().removeData();
            $ctx.unbind().removeData();
        },

        /**
         * Initializes the beforeBinding phase.
         *
         * @method initBeforeBinding
         * @return {void}
         */
        initBeforeBinding: function() {
            var that = this;

            /** 
             * Start the beforeBinding phase if there are no dependency for
             * this phase
             */
            this.checkDependencies('beforeBinding', function() {
                /**
                 * Call the hook method beforeBinding from the individual
                 * instance because there might be some ajax calls, the
                 * bindEvents method must be called from the beforeBinding
                 * function after it has been run.
                 */
                if (that.beforeBinding) {
                    that.beforeBinding(function() {
                        that.beforeBindingCallback();
                    });
                }
                else {
                    that.beforeBindingCallback();
                }
            });
        },

        /**
         * Callback for the before binding phase.
         * 
         * @method beforeBindingCallback
         * @return {void}
         */
        beforeBindingCallback: function() {
            // Decrement the dependency counter for the onBinding phase
            this.dependencyCounter.onBinding--;
            this.initOnBinding();
        },

        /**
         * Initializes the onBinding phase.
         *
         * @method initOnBinding
         * @return {void}
         */
        initOnBinding: function() {
            var that = this;

            /** 
             * Start the onBinding phase if there are no dependencies for this
             * phase.
             */
            this.checkDependencies('onBinding',function() {
                // Call the hook method bindEvents from the individual instance
                if (that.onBinding) {
                    that.onBinding();
                }

                // Decrement the dependency counter for the afterBinding phase
                that.dependencyCounter.afterBinding--;
                that.initAfterBinding();
            });
        },

        /**
         * Initializes the afterBinding phase.
         *
         * @method initAfterBinding
         * @return {void}
         */
        initAfterBinding: function() {
            var that = this;

            /**
             * Start the afterBinding phase if there are no dependencies for
             * this phase
             */
            this.checkDependencies('afterBinding', function() {
                /** 
                 * Inform the sandbox that the module is ready for the
                 * afterBinding phase.
                 */
                that.sandbox.readyForAfterBinding(function() {

                    /**
                     * Call the hook method afterBinding from the individual
                     * instance
                     */
                    if (that.afterBinding) {
                        that.afterBinding();
                    }
                });
            });
        },

        /**
         * Checks the dependency load state of the given phase.
         * Initializes the appropriate phase if all dependencies are loaded.
         *
         * @method checkDependencies
         * @param {String} phase 
         *      The phase to check / initialize
         * @param {Function} callback 
         *      The callback to execute if all dependencies were loaded
         * @return {void}
         */
        checkDependencies: function(phase, callback) {
            if (this.dependencyCounter[phase] === 0) {
                // Execute the callback
                callback();
            }
        },

        /**
         * Manages the required dependencies.
         *
         * @method require
         * @param {String} dependency 
         *      The dependency (e.g. swfobject.js)
         * @param {String} type 
         *      The dependency type (library | plugin | util | url)
         * @param {String} phase 
         *      The module phase where the dependency is needed
         *      (e.g. beforeBinding, onBinding)
         * @param {boolean} executeCallback 
         *      Indicates whether the phase callback should be executed or not.
         *      This is useful for dependencies that provide their own callback
         *      mechanism.
         * @return {void}
         */
        require: function(dependency, type, phase, executeCallback) {
            type = type || 'plugin';
            phase = phase || 'onBinding';
            executeCallback = executeCallback === false ? false : true;

            // Increment the dependency counter
            this.dependencyCounter[phase]++;

            // Proxy the callback to the outermost decorator
            var callback = $.proxy(function() {
                if (executeCallback) {
                    var that = this;

                    /**
                     * Decrement the dependency counter for the appropriate
                     * phase.
                     */
                    this.dependencyCounter[phase]--;
                    that['init' + Tc.Utils.String.capitalize(phase)]();
                }
            }, this.sandbox.getModuleById(this.modId));

            this.sandbox.loadDependency(dependency, type, callback, phase);
        },

        /**
         * Notifies all attached connectors about changes.
         *
         * @method fire
         * @param {String} state 
         *      The new state
         * @param {Object} data 
         *      The data to provide to your connected modules
         * @param {Function} defaultAction 
         *      The default action to perform
         * @return {void}
         */
        fire: function(state, data, defaultAction) {
            var that = this,
                connectors = this.connectors;

            data = data ||{};
            state = Tc.Utils.String.capitalize(state);

            $.each(connectors, function() {
                var connector = this;

                // Callback combining the defaultAction and the afterAction
                var callback = function() {
                    if (typeof defaultAction == 'function') {
                        defaultAction();
                    }
                    connector.notify(that, 'after' + state, data);
                };

                if (connector.notify(that, 'on' + state, data, callback)) {
                    callback();
                }
            });

            if (connectors.length < 1) {
                if (typeof defaultAction == 'function') {
                    defaultAction();
                }
            }
        },

        /**
         * Attaches a connector (observer).
         *
         * @method attachConnector
         * @param {Connector} connector 
         *      The connector to attach
         * @return {void}
         */
        attachConnector: function(connector) {
            this.connectors.push(connector);
        },

        /**
         * Detaches a connector (observer).
         *
         * @method detachConnector
         * @param {Connector} connector
         *      The connector to detach
         * @return {void}
         */
        detachConnector: function(connector) {
            var connectors = this.connectors;

            for (var i = 0, len = connectors.length; i < len; i++) {
                if(connectors[i] === connector) {
                    delete connectors[i];
                    connectors.splice(i, 1);
                    break;
                }
            }
        },

        /**
         * Decorates itself with the given skin.
         *
         * @method getDecoratedModule
         * @param {String} module 
         *      The name of the module
         * @param {String} skin 
         *      The name of the skin
         * @return {Module} 
         *      The decorated module
         */
        getDecoratedModule: function(module, skin) {
            if (Tc.Module[module][skin]) {
                var decorator = Tc.Module[module][skin];

                /*
                 * Sets the prototype object to the module.
                 * So the "non-decorated" functions will be called on the module
                 * without implementing the whole module interface.
                 */
                decorator.prototype = this;
                decorator.prototype.constructor = Tc.Module[module][skin];

                return new decorator(this);
            }

            return null;
        }
    });
})(Tc.$);

(function($) {
    "use strict";

    /**
     * Base class for the different connectors.
     *
     * @author Remo Brunschwiler
     * @namespace Tc
     * @class Connector
     */
    Tc.Connector = Class.extend({

        /**
         * Initializes the Connector.
         *
         * @method init
         * @return {void}
         * @constructor
         * @param {String} connectorId
         *      The unique connector ID
         */
        init : function(connectorId) {
            this.connectorId = connectorId;
            this.components = [];
        },

        /**
         * Registers a component.
         *
         * @method registerComponent
         * @param {Module} component 
         *      The module to register
         * @param {String} role 
         *      The role of the module (e.g. master, slave etc.)
         * @return {void}
         */
        registerComponent: function(component, role) {
            role = role || 'standard';

            this.components.push({
                'component': component,
                'role': role
            });
        },

        /**
         * Unregisters a component.
         *
         * @method unregisterComponent
         * @param {Module} component 
         *      The module to unregister
         * @return {void}
         */
        unregisterComponent: function(component) {
            var components = this.components;

            for (var i = 0, len = components.length; i < len; i++) {
               if(components[i] && components[i].component === component) {
                   delete components[i];
               }
            }
        },

        /**
         * Notifies all registered components about a state change 
         * This can be be overriden in the specific connectors.
         *
         * @method notify
         * @param {Module} origin
         *      The module that sends the state change
         * @param {String} state 
         *      The component's state
         * @param {Object} data 
         *      Contains the state relevant data (if any)
         * @param {Function} callback 
         *      The callback function, it can be executed after an asynchronous
         *      action.
         * @return {boolean} 
         *      Indicates whether the default action should be excuted or not
         */
        notify: function(origin, state, data, callback) {

            /**
             * Gives the components the ability to prevent the default- and
             * afteraction from the events by returning false in the
             * on {Event}-Handler.
             */
            
            var proceed = true,
                components = this.components;

            for (var i = 0, len = components.length; i < len; i++) {
                var component = components[i].component;
                if (component && component !== origin && component[state]) {
                    if (component[state](data, callback) === false) {
                        proceed = false;
                    }
                }
            }

            return proceed;
        }
    });
})(Tc.$);

/*
 * Contains utility functions for several tasks.
 */
Tc.Utils = {};

/**
 * Contains utility functions for string concerning tasks.
 *
 * @author Remo Brunschwiler
 * @namespace Tc.Utils
 * @class String
 * @static
 */
(function($) {
    Tc.Utils.String = {
        /**
         * Capitalizes the first letter of the given string.
         *
         * @method capitalize
         * @param {String} str 
         *      The original string
         * @return {String} 
         *      The capitalized string
         */
        capitalize: function(str) {
            // Capitalize the first letter
            return str.substr(0, 1).toUpperCase().concat(str.substr(1));
        }
    };   
})(Tc.$);

/*
 * JQuery URL Parser plugin
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */
 

;(function($, undefined) {
    
    var tag2attr = {
        a       : 'href',
        img     : 'src',
        form    : 'action',
        base    : 'href',
        script  : 'src',
        iframe  : 'src',
        link    : 'href'
    },
    
	key = ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","fragment"], // keys available to query
	
	aliases = { "anchor" : "fragment" }, // aliases for backwards compatability

	parser = {
		strict  : /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,  //less intuitive, more accurate to the specs
		loose   :  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
	},
	
	querystring_parser = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g, // supports both ampersand and semicolon-delimted query string key/value pairs
	
	fragment_parser = /(?:^|&|;)([^&=;]*)=?([^&;]*)/g; // supports both ampersand and semicolon-delimted fragment key/value pairs
	
	function parseUri( url, strictMode )
	{
		var str = decodeURI( url ),
		    res   = parser[ strictMode || false ? "strict" : "loose" ].exec( str ),
		    uri = { attr : {}, param : {}, seg : {} },
		    i   = 14;
		
		while ( i-- )
		{
			uri.attr[ key[i] ] = res[i] || "";
		}
		
		// build query and fragment parameters
		
		uri.param['query'] = {};
		uri.param['fragment'] = {};
		
		uri.attr['query'].replace( querystring_parser, function ( $0, $1, $2 ){
			if ($1)
			{
				uri.param['query'][$1] = $2;
			}
		});
		
		uri.attr['fragment'].replace( fragment_parser, function ( $0, $1, $2 ){
			if ($1)
			{
				uri.param['fragment'][$1] = $2;
			}
		});
				
		// split path and fragement into segments
		
        uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g,'').split('/');
        
        uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g,'').split('/');
        
        // compile a 'base' domain attribute
        
        uri.attr['base'] = uri.attr.host ? uri.attr.protocol+"://"+uri.attr.host + (uri.attr.port ? ":"+uri.attr.port : '') : '';
        
		return uri;
	};
	
	function getAttrName( elm )
	{
		var tn = elm.tagName;
		if ( tn !== undefined ) return tag2attr[tn.toLowerCase()];
		return tn;
	}
	
	$.fn.url = function( strictMode )
	{
	    var url = '';
	    
	    if ( this.length )
	    {
	        url = $(this).attr( getAttrName(this[0]) ) || '';
	    }
	    
        return $.url( url, strictMode );
	};
	
	$.url = function( url, strictMode )
	{
	    if ( arguments.length === 1 && url === true )
        {
            strictMode = true;
            url = undefined;
        }
        
        strictMode = strictMode || false;
        url = url || window.location.toString();
        	    	            
        return {
            
            data : parseUri(url, strictMode),
            
            // get various attributes from the URI
            attr : function( attr )
            {
                attr = aliases[attr] || attr;
                return attr !== undefined ? this.data.attr[attr] : this.data.attr;
            },
            
            // return query string parameters
            param : function( param )
            {
                return param !== undefined ? this.data.param.query[param] : this.data.param.query;
            },
            
            // return fragment parameters
            fparam : function( param )
            {
                return param !== undefined ? this.data.param.fragment[param] : this.data.param.fragment;
            },
            
            // return path segments
            segment : function( seg )
            {
                if ( seg === undefined )
                {
                    return this.data.seg.path;                    
                }
                else
                {
                    seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
                    return this.data.seg.path[seg];                    
                }
            },
            
            // return fragment segments
            fsegment : function( seg )
            {
                if ( seg === undefined )
                {
                    return this.data.seg.fragment;                    
                }
                else
                {
                    seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
                    return this.data.seg.fragment[seg];                    
                }
            }
            
        };
        
	};
	
})(jQuery);
/*!
 * jQuery Cookie Plugin
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */

(function($) {
    $.cookie = function(key, value, options) {

        // key and at least value given, set cookie...
        if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null || value === undefined)) {
            options = $.extend({}, options);

            if (value === null || value === undefined) {
                options.expires = -1;
            }

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            value = String(value);

            return (document.cookie = [
                encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path    ? '; path=' + options.path : '',
                options.domain  ? '; domain=' + options.domain : '',
                options.secure  ? '; secure' : ''
            ].join(''));
        }

        // key and possibly options given, get cookie...
        options = value || {};
        var decode = options.raw ? function(s) { return s; } : decodeURIComponent;

        var pairs = document.cookie.split('; ');
        for (var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
            if (decode(pair[0]) === key) return decode(pair[1] || ''); // IE saves cookies with empty string as "c; ", e.g. without "=" as opposed to EOMB, thus pair[1] may be undefined
        }
        return null;
    };
})(jQuery);
/*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

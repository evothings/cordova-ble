// API definition for EvoThings BLE plugin.
//
// Use jsdoc to generate documentation.

// The following line causes a jsdoc error.
// Use the jsdoc option -l to ignore the error.
var exec = cordova.require('cordova/exec');

/**
 * @module cordova-plugin-ble
 * @description Functions and properties in this module are available
 * under the global name <code>evothings.ble</code>
 */

/********** BLE Central API **********/

/**
 * Start scanning for devices.
 * <p>An array of service UUID strings may be given (optional parameter).
 * One or more service UUIDs must be specified for iOS background scanning to work.</p>
 * <p>Found devices and errors are reported to the supplied callback functions.</p>
 * <p>Will keep scanning until you call stopScan().</p>
 * <p>To conserve energy, call stopScan() as soon as you've found the device
 * you're looking for.</p>
 * <p>Call stopScan() before calling startScan() again.</p>
 *
 * @param {array} uuids - Array with service UUID strings (optional).
 * On iOS multiple UUIDs are scanned for using logical OR operator,
 * any UUID that matches any of the UUIDs adverticed by the device
 * will count as a match. On Android, multiple UUIDs are scanned for
 * using AND logic, the device must advertise all of the given UUIDs
 * to produce a match. (The matching logic will be unified in future
 * versions of the plugin.) When providing one service UUID, behaviour
 * is the same on Android and iOS. Learning out this parameter or
 * setting it to null, will scan for all devices, regardless of
 * advertised services.
 * @param {scanCallback} success - Success callback, called repeatedly
 * for each found device.
 * @param {failCallback} fail - Error callback.
 *
 * @example
 *   // Scan for all services.
 *   evothings.ble.startScan(
 *       function(device)
 *       {
 *           console.log('BLE startScan found device named: ' + device.name);
 *       },
 *       function(errorCode)
 *       {
 *           console.log('BLE startScan error: ' + errorCode);
 *       }
 *   );
 *
 *   // Scan for specific service (Eddystone Service UUID).
 *   evothings.ble.startScan(
 *       ['0000FEAA-0000-1000-8000-00805F9B34FB'],
 *       function(device)
 *       {
 *           console.log('BLE startScan found device named: ' + device.name);
 *       },
 *       function(errorCode)
 *       {
 *           console.log('BLE startScan error: ' + errorCode);
 *       }
 *   );
 */
exports.startScan = function(uuids, success, fail) {
	if ('function' == typeof uuids)
	{
		// No Service UUIDs specified.
		exec(uuids, success, 'BLE', 'startScan', []);
	}
	else
	{
		exec(success, fail, 'BLE', 'startScan', [uuids]);
	}
};

/** This function is a parameter to startScan() and is called when a new device is discovered.
* @callback scanCallback
* @param {DeviceInfo} device
*/

/** Info about a BLE device.
* @typedef {Object} DeviceInfo
* @property {string} address - Uniquely identifies the device.
* Pass this to connect().
* The form of the address depends on the host platform.
* @property {number} rssi - A negative integer, the signal strength in decibels.
* @property {string} name - The device's name, or nil.
* @property {string} scanRecord - Base64-encoded binary data.
* Its meaning is device-specific. Not available on iOS.
* @property {AdvertisementData} advertisementData - Object containing some
* of the data from the scanRecord. Available natively on iOS. Available on
* Android by parsing the scanRecord, which is implemented in the library EasyBLE:
* {@link https://github.com/evothings/evothings-libraries/blob/master/libs/evothings/easyble/easyble.js}.
*/

/** Information extracted from a scanRecord. Some or all of the fields may be undefined. This varies between BLE devices.
 * Depending on OS version and BLE device, additional fields, not documented here, may be present.
 * @typedef {Object} AdvertisementData
 * @property {string} kCBAdvDataLocalName - The device's name. Equal to DeviceInfo.name.
 * @property {number} kCBAdvDataTxPowerLevel - Transmission power level as advertised by the device.
 * @property {number} kCBAdvDataChannel - A positive integer, the BLE channel on which the device listens for connections. Ignore this number.
 * @property {boolean} kCBAdvDataIsConnectable - True if the device accepts connections. False if it doesn't.
 * @property {array} kCBAdvDataServiceUUIDs - Array of strings, the UUIDs of services advertised by the device. Formatted according to RFC 4122, all lowercase.
 * @property {object} kCBAdvDataServiceData - Dictionary of strings to strings. The keys are service UUIDs. The values are base-64-encoded binary data.
 * @property {string} kCBAdvDataManufacturerData - Base-64-encoded binary data. This field is used by BLE devices to advertise custom data that don't fit into any of the other fields.
 */

/** This function is called when an operation fails.
* @callback failCallback
* @param {string} errorString - A human-readable string that describes the error that occurred.
*/

/** Stops scanning for devices.
*
* @example
evothings.ble.stopScan();
*/
exports.stopScan = function() {
	exec(null, null, 'BLE', 'stopScan', []);
};

/** Connect to a remote device.
* @param {string} address - From scanCallback.
* @param {connectCallback} win
* @param {failCallback} fail
* @example
evothings.ble.connect(
	address,
	function(info)
	{
		console.log('BLE connect status for device: '
			+ info.deviceHandle
			+ ' state: '
			+ info.state);
	},
	function(errorCode)
	{
		console.log('BLE connect error: ' + errorCode);
	}
);
*/
exports.connect = function(address, win, fail) {
	exec(win, fail, 'BLE', 'connect', [address]);
};

/** Will be called whenever the device's connection state changes.
* @callback connectCallback
* @param {ConnectInfo} info
*/

/** Info about connection events and state.
* @typedef {Object} ConnectInfo
* @property {number} deviceHandle - Handle to the device. Save it for other function calls.
* @property {number} state - One of the {@link module:cordova-plugin-ble.connectionState} keys.
*/

/** A map describing possible connection states.
* @alias module:cordova-plugin-ble.connectionState
* @readonly
* @enum
*/
exports.connectionState = {
	/** STATE_DISCONNECTED */
	0: 'STATE_DISCONNECTED',
	/** STATE_CONNECTING */
	1: 'STATE_CONNECTING',
	/** STATE_CONNECTED */
	2: 'STATE_CONNECTED',
	/** STATE_DISCONNECTING */
	3: 'STATE_DISCONNECTING',

	/** 0 */
	'STATE_DISCONNECTED': 0,
	/** 1 */
	'STATE_CONNECTING': 1,
	/** 2 */
	'STATE_CONNECTED': 2,
	/** 3 */
	'STATE_DISCONNECTING': 3,
};

/** Close the connection to a remote device.
* <p>Frees any native resources associated with the device.
* <p>Does not cause any callbacks to the function passed to connect().

* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @example
evothings.ble.close(deviceHandle);
*/
exports.close = function(deviceHandle) {
	exec(null, null, 'BLE', 'close', [deviceHandle]);
};

/** Fetch the remote device's RSSI (signal strength).
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {rssiCallback} win
* @param {failCallback} fail
* @example
evothings.ble.rssi(
	deviceHandle,
	function(rssi)
	{
		console.log('BLE rssi: ' + rssi);
	},
	function(errorCode)
	{
		console.log('BLE rssi error: ' + errorCode);
	}
);
*/
exports.rssi = function(deviceHandle, win, fail) {
	exec(win, fail, 'BLE', 'rssi', [deviceHandle]);
};

/** This function is called with an RSSI value.
* @callback rssiCallback
* @param {number} rssi - A negative integer, the signal strength in decibels.
*/

/** Fetch information about a remote device's services.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {serviceCallback} win - Called with array of {@link Service} objects.
* @param {failCallback} fail
* @example
evothings.ble.services(
	deviceHandle,
	function(services)
	{
		for (var i = 0; i < services.length; i++)
		{
			var service = services[i];
			console.log('BLE service: ');
			console.log('  ' + service.handle);
			console.log('  ' + service.uuid);
			console.log('  ' + service.serviceType);
		}
	},
	function(errorCode)
	{
		console.log('BLE services error: ' + errorCode);
	});
*/
exports.services = function(deviceHandle, win, fail) {
	exec(win, fail, 'BLE', 'services', [deviceHandle]);
};

/**
* @callback serviceCallback
* @param {Array} services - Array of {@link Service} objects.
*/

/** Describes a GATT service.
* @typedef {Object} Service
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {module:cordova-plugin-ble.serviceType} type
*/

/** A map describing possible service types.
* @readonly
* @alias module:cordova-plugin-ble.serviceType
* @enum
*/
exports.serviceType = {
	/** SERVICE_TYPE_PRIMARY */
	0: 'SERVICE_TYPE_PRIMARY',
	/** SERVICE_TYPE_SECONDARY */
	1: 'SERVICE_TYPE_SECONDARY',

	/** 0 */
	'SERVICE_TYPE_PRIMARY': 0,
	/** 1 */
	'SERVICE_TYPE_SECONDARY': 1,
};

/** Fetch information about a service's characteristics.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} serviceHandle - A handle from {@link serviceCallback}.
* @param {characteristicCallback} win - Called with array of {@link Characteristic} objects.
* @param {failCallback} fail
* @example
evothings.ble.characteristics(
	deviceHandle,
	service.handle,
	function(characteristics)
	{
		for (var i = 0; i < characteristics.length; i++)
		{
			var characteristic = characteristics[i];
			console.log('BLE characteristic: ' + characteristic.uuid);
		}
	},
	function(errorCode)
	{
		console.log('BLE characteristics error: ' + errorCode);
	});
*/
exports.characteristics = function(deviceHandle, serviceHandle, win, fail) {
	exec(win, fail, 'BLE', 'characteristics', [deviceHandle, serviceHandle]);
};

/**
* @callback characteristicCallback
* @param {Array} characteristics - Array of {@link Characteristic} objects.
*/

/** Describes a GATT characteristic.
* @typedef {Object} Characteristic
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {module:cordova-plugin-ble.permission} permissions - Bitmask of zero or more permission flags.
* @property {module:cordova-plugin-ble.property} properties - Bitmask of zero or more property flags.
* @property {module:cordova-plugin-ble.writeType} writeType
*/

/** A map describing possible permission flags.
* @alias module:cordova-plugin-ble.permission
* @readonly
* @enum
*/
exports.permission = {
	/** PERMISSION_READ */
	1: 'PERMISSION_READ',
	/** PERMISSION_READ_ENCRYPTED */
	2: 'PERMISSION_READ_ENCRYPTED',
	/** PERMISSION_READ_ENCRYPTED_MITM */
	4: 'PERMISSION_READ_ENCRYPTED_MITM',
	/** PERMISSION_WRITE */
	16: 'PERMISSION_WRITE',
	/** PERMISSION_WRITE_ENCRYPTED */
	32: 'PERMISSION_WRITE_ENCRYPTED',
	/** PERMISSION_WRITE_ENCRYPTED_MITM */
	64: 'PERMISSION_WRITE_ENCRYPTED_MITM',
	/** PERMISSION_WRITE_SIGNED */
	128: 'PERMISSION_WRITE_SIGNED',
	/** PERMISSION_WRITE_SIGNED_MITM */
	256: 'PERMISSION_WRITE_SIGNED_MITM',

	/** 1 */
	'PERMISSION_READ': 1,
	/** 2 */
	'PERMISSION_READ_ENCRYPTED': 2,
	/** 4 */
	'PERMISSION_READ_ENCRYPTED_MITM': 4,
	/** 16 */
	'PERMISSION_WRITE': 16,
	/** 32 */
	'PERMISSION_WRITE_ENCRYPTED': 32,
	/** 64 */
	'PERMISSION_WRITE_ENCRYPTED_MITM': 64,
	/** 128 */
	'PERMISSION_WRITE_SIGNED': 128,
	/** 256 */
	'PERMISSION_WRITE_SIGNED_MITM': 256,
};

/** A map describing possible property flags.
* @alias module:cordova-plugin-ble.property
* @readonly
* @enum
*/
exports.property = {
	/** PROPERTY_BROADCAST */
	1: 'PROPERTY_BROADCAST',
	/** PROPERTY_READ */
	2: 'PROPERTY_READ',
	/** PROPERTY_WRITE_NO_RESPONSE */
	4: 'PROPERTY_WRITE_NO_RESPONSE',
	/** PROPERTY_WRITE */
	8: 'PROPERTY_WRITE',
	/** PROPERTY_NOTIFY */
	16: 'PROPERTY_NOTIFY',
	/** PROPERTY_INDICATE */
	32: 'PROPERTY_INDICATE',
	/** PROPERTY_SIGNED_WRITE */
	64: 'PROPERTY_SIGNED_WRITE',
	/** PROPERTY_EXTENDED_PROPS */
	128: 'PROPERTY_EXTENDED_PROPS',

	/** 1 */
	'PROPERTY_BROADCAST': 1,
	/** 2 */
	'PROPERTY_READ': 2,
	/** 4 */
	'PROPERTY_WRITE_NO_RESPONSE': 4,
	/** 8 */
	'PROPERTY_WRITE': 8,
	/** 16 */
	'PROPERTY_NOTIFY': 16,
	/** 32 */
	'PROPERTY_INDICATE': 32,
	/** 64 */
	'PROPERTY_SIGNED_WRITE': 4,
	/** 128 */
	'PROPERTY_EXTENDED_PROPS': 128,
};

/** A map describing possible write types.
* @alias module:cordova-plugin-ble.writeType
* @readonly
* @enum
*/
exports.writeType = {
	/** WRITE_TYPE_NO_RESPONSE */
	1: 'WRITE_TYPE_NO_RESPONSE',
	/** WRITE_TYPE_DEFAULT */
	2: 'WRITE_TYPE_DEFAULT',
	/** WRITE_TYPE_SIGNED */
	4: 'WRITE_TYPE_SIGNED',

	/** 1 */
	'WRITE_TYPE_NO_RESPONSE': 1,
	/** 2 */
	'WRITE_TYPE_DEFAULT': 2,
	/** 4 */
	'WRITE_TYPE_SIGNED': 4,
};

/** Fetch information about a characteristic's descriptors.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {descriptorCallback} win - Called with array of {@link Descriptor} objects.
* @param {failCallback} fail
* @example
evothings.ble.descriptors(
	deviceHandle,
	characteristic.handle,
	function(descriptors)
	{
		for (var i = 0; i < descriptors.length; i++)
		{
			var descriptor = descriptors[i];
			console.log('BLE descriptor: ' + descriptor.uuid);
		}
	},
	function(errorCode)
	{
		console.log('BLE descriptors error: ' + errorCode);
	});
*/
exports.descriptors = function(deviceHandle, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'descriptors', [deviceHandle, characteristicHandle]);
};

/**
* @callback descriptorCallback
* @param {Array} descriptors - Array of {@link Descriptor} objects.
*/

/** Describes a GATT descriptor.
* @typedef {Object} Descriptor
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {module:cordova-plugin-ble.permission} permissions - Bitmask of zero or more permission flags.
*/

/**
* @callback dataCallback
* @param {ArrayBuffer} data
*/

/** Reads a characteristic's value from a remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {dataCallback} win
* @param {failCallback} fail
* @example
evothings.ble.readCharacteristic(
	deviceHandle,
	characteristic.handle,
	function(data)
	{
		console.log('BLE characteristic data: ' + evothings.ble.fromUtf8(data));
	},
	function(errorCode)
	{
		console.log('BLE readCharacteristic error: ' + errorCode);
	});
*/
exports.readCharacteristic = function(deviceHandle, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'readCharacteristic', [deviceHandle, characteristicHandle]);
};

/** Reads a descriptor's value from a remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} descriptorHandle - A handle from {@link descriptorCallback}.
* @param {dataCallback} win
* @param {failCallback} fail
* @example
evothings.ble.readDescriptor(
	deviceHandle,
	descriptor.handle,
	function(data)
	{
		console.log('BLE descriptor data: ' + evothings.ble.fromUtf8(data));
	},
	function(errorCode)
	{
		console.log('BLE readDescriptor error: ' + errorCode);
	});
*/
exports.readDescriptor = function(deviceHandle, descriptorHandle, win, fail) {
	exec(win, fail, 'BLE', 'readDescriptor', [deviceHandle, descriptorHandle]);
};

/**
* @callback emptyCallback - Callback that takes no parameters.
This callback indicates that an operation was successful,
without specifying and additional information.
*/

/** Write a characteristic's value to the remote device.
*
* Writes with response, the remote device sends back a confirmation message.
* This is safe but slower than writing without response.
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win - Called when the remote device has confirmed the write.
* @param {failCallback} fail - Called if the operation fails.
* @example TODO: Add example.
*/
exports.writeCharacteristic = function(deviceHandle, characteristicHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeCharacteristic', [deviceHandle, characteristicHandle, data.buffer]);
};

/** Write a characteristic's value without response.
*
* Asks the remote device to NOT send a confirmation message.
* This may be used for increased data throughput.
*
* If the application needs to ensure data integrity, a separate safety protocol
* would be required. Design of such protocols is beyond the scope of this document.
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win - Called when the data has been sent.
* @param {failCallback} fail - Called if the operation fails.
*/
exports.writeCharacteristicWithoutResponse = function(deviceHandle, characteristicHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeCharacteristicWithoutResponse', [deviceHandle, characteristicHandle, data.buffer]);
};

/** Write a descriptor's value to a remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} descriptorHandle - A handle from {@link descriptorCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win
* @param {failCallback} fail
* @example TODO: Add example.
*/
exports.writeDescriptor = function(deviceHandle, descriptorHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeDescriptor', [deviceHandle, descriptorHandle, data.buffer]);
};

/** Request notification or indication on changes to a characteristic's value.
* This is more efficient than polling the value using readCharacteristic().
* This function automatically detects if the characteristic supports 
* notification or indication. 
*
* <p>Android only: To disable this functionality and write
* the configuration descriptor yourself, supply an options object as
* last parameter, see example below.</p>
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {dataCallback} win - Called every time the value changes.
* @param {failCallback} fail - Error callback.
* @param {object} options - Android only: Optional object with options.
* Set field writeConfigDescriptor to false to disable automatic writing of
* notification or indication descriptor value. This is useful if full control
* of writing the config descriptor is needed.
*
* @example
// Example call:
evothings.ble.enableNotification(
	deviceHandle,
	characteristic.handle,
	function(data)
	{
		console.log('BLE characteristic data: ' + evothings.ble.fromUtf8(data));
	},
	function(errorCode)
	{
		console.log('BLE enableNotification error: ' + errorCode);
	});
	
// To disable automatic writing of the config descriptor 
// supply this as last parameter to enableNotification:
{ writeConfigDescriptor: false }
*/
exports.enableNotification = function(deviceHandle, characteristicHandle, win, fail, options) {
	var flags = 0;
	if (options && !options.writeConfigDescriptor) {
		var flags = 1; // Don't write config descriptor.
	}
	exec(win, fail, 'BLE', 'enableNotification', [deviceHandle, characteristicHandle, flags]);
};

/** Disable notification or indication of a characteristic's value.
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {emptyCallback} win - Success callback.
* @param {failCallback} fail - Error callback.
* @param {object} options - Android only: Optional object with options.
* Set field writeConfigDescriptor to false to disable automatic writing of
* notification or indication descriptor value. This is useful if full control
* of writing the config descriptor is needed.
*
* @example
// Example call:
evothings.ble.disableNotification(
	deviceHandle,
	characteristic.handle,
	function()
	{
		console.log('BLE characteristic notification disabled');
	},
	function(errorCode)
	{
		console.log('BLE disableNotification error: ' + errorCode);
	});
	
// To disable automatic writing of the config descriptor 
// supply this as last parameter to enableNotification:
{ writeConfigDescriptor: false }
*/
exports.disableNotification = function(deviceHandle, characteristicHandle, win, fail, options) {
	var flags = 0;
	if (options && !options.writeConfigDescriptor) {
		var flags = 1; // Don't write config descriptor.
	}
	exec(win, fail, 'BLE', 'disableNotification', [deviceHandle, characteristicHandle, flags]);
};

/** i is an integer. It is converted to byte and put in an array[1].
* The array is returned.
* <p>assert(string.charCodeAt(0) == i).
*
* @param {number} i
* @param {dataCallback} win - Called every time the value changes.
*/
exports.testCharConversion = function(i, win) {
	exec(win, null, 'BLE', 'testCharConversion', [i]);
};

/** Resets the device's Bluetooth system.
* This is useful on some buggy devices where BLE functions stops responding until reset.
* Available on Android 4.3+. This function takes 3-5 seconds to reset BLE.
* On iOS this function stops any ongoing scan operation and disconnects
* all connected devices.
*
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.reset = function(win, fail) {
	exec(win, fail, 'BLE', 'reset', []);
};

/** Converts an ArrayBuffer containing UTF-8 data to a JavaScript String.
* @param {ArrayBuffer} a
* @returns string
*/
exports.fromUtf8 = function(a) {
	return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(a))));
};

/** Converts a JavaScript String to an Uint8Array containing UTF-8 data.
* @param {string} s
* @returns Uint8Array
*/
exports.toUtf8 = function(s) {
	var strUtf8 = unescape(encodeURIComponent(s));
	var ab = new Uint8Array(strUtf8.length);
	for (var i = 0; i < strUtf8.length; i++) {
		ab[i] = strUtf8.charCodeAt(i);
	}
	return ab;
};


/** Fetch information about a remote device's services,
* as well as its associated characteristics and descriptors.
*
* This function is an easy-to-use wrapper of the low-level functions
* ble.services(), ble.characteristics() and ble.descriptors().
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {serviceCallback} win - Called with array of {@link Service} objects.
* Those Service objects each have an additional field "characteristics", which is an array of {@link Characteristic} objects.
* Those Characteristic objects each have an additional field "descriptors", which is an array of {@link Descriptor} objects.
* @param {failCallback} fail
*/
exports.readAllServiceData = function(deviceHandle, win, fail)
{
	// Array of populated services.
	var serviceArray = [];

	// Counter that tracks the number of info items read.
	// This value is incremented and decremented when reading.
	// When value is back to zero, all items are read.
	var readCounter = 0;

	var servicesCallbackFun = function()
	{
		return function(services)
		{
			readCounter += services.length;
			for (var i = 0; i < services.length; ++i)
			{
				var service = services[i];
				serviceArray.push(service);
				service.characteristics = [];

				// Read characteristics for service.
        exports.characteristics(
					deviceHandle,
					service.handle,
					characteristicsCallbackFun(service),
					function(errorCode)
					{
						console.log('characteristics error: ' + errorCode);
						fail(errorCode);
					});
			}
		};
	};

	var characteristicsCallbackFun = function(service)
	{
		return function(characteristics)
		{
			--readCounter;
			readCounter += characteristics.length;
			for (var i = 0; i < characteristics.length; ++i)
			{
				var characteristic = characteristics[i];
				service.characteristics.push(characteristic);
				characteristic.descriptors = [];

				// Read descriptors for characteristic.
        exports.descriptors(
					deviceHandle,
					characteristic.handle,
					descriptorsCallbackFun(characteristic),
					function(errorCode)
					{
						console.log('descriptors error: ' + errorCode);
						fail(errorCode);
					});
			}
		};
	};

	var descriptorsCallbackFun = function(characteristic)
	{
		return function(descriptors)
		{
			--readCounter;
			for (var i = 0; i < descriptors.length; ++i)
			{
				var descriptor = descriptors[i];
				characteristic.descriptors.push(descriptor);
			}
			if (0 == readCounter)
			{
				// Everything is read.
				win(serviceArray);
			}
		};
	};

	// Read services for device.
	exports.services(
		deviceHandle,
		servicesCallbackFun(),
		function(errorCode)
		{
			console.log('services error: ' + errorCode);
			fail(errorCode);
		});
};


/********** BLE Peripheral API **********/

/**
 * BLE Peripheral API. Experimental, supported only on Android.
 * @namespace
 */
exports.peripheral = {}

// Internal. Returns a function that will handle GATT server callbacks.
function gattServerCallbackHandler(winFunc, settings) {
	// collect read/write callbacks and add handles, so the native side can tell us which one to call.
	var readCallbacks = {};
	var writeCallbacks = {};
	var nextHandle = 1;

	function handleCallback(object, name, callbacks) {
		if(!object[name]) {
			throw name+" missing!";
		}
		callbacks[nextHandle] = object[name];
		object[name+"Handle"] = nextHandle;
		nextHandle += 1;
	}

	function handleReadWrite(object) {
		/* // primitive version
		if(!object.readRequestCallback) {
			throw "readRequestCallback missing!");
		}
		readCallbacks[nextHandle] = object.readRequestCallback;
		*/
		handleCallback(object, "onReadRequest", readCallbacks);
		handleCallback(object, "onWriteRequest", writeCallbacks);
	}

	for(var i=0; i<settings.services.length; i++) {
		var service = settings.services[i];
		for(var j=0; j<service.characteristics.length; j++) {
			var characteristic = service.characteristics[j];
			handleReadWrite(characteristic);
			for(var k=0; k<characteristic.descriptors.length; k++) {
				var descriptor = characteristic.descriptors[k];
				handleReadWrite(descriptor);
			}
		}
	}

	settings.nextHandle = nextHandle;

	return function(args) {
		// primitive version
		/*if(args.name == "win") {
			winFunc();
			return;
		}*/
		var funcs = {
			win: winFunc,
			connection: function() {
				settings.onConnectionStateChange(args.deviceHandle, args.connected);
			},
			write: function() {
				writeCallbacks[args.callbackHandle](args.deviceHandle, args.requestId, args.data);
			},
			read: function() {
				readCallbacks[args.callbackHandle](args.deviceHandle, args.requestId);
			},
		};
		funcs[args.name]();
	};
}

/** Starts the GATT server.
* There can be only one server. If this function is called while the server is still running, the call will fail.
* Once this function succeeds, the server may be stopped by calling stopGattServer.
*
* @param {GattSettings} settings
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.peripheral.startGattServer = function(settings, win, fail) {
	exec(gattServerCallbackHandler(win, settings), fail, 'BLE', 'startGattServer', [settings]);
};

// GattSettings
/** Describes a GATT server.
* @typedef {Object} GattSettings
* @property {Array} services - An array of GattService objects.
* @property {connectionStateChangeCallback} onConnectionStateChange
*/

/** Describes a GATT service.
* @typedef {Object} GattService
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {serviceType} type
* @property {Array} characteristics - An array of GattCharacteristic objects.
*/

/** Describes a GATT characteristic.
* @typedef {Object} GattCharacteristic
* @property {int} handle - Optional. Used in notify(). If set, must be unique among all other GattCharacteristic handles.
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {module:cordova-plugin-ble.permission} permissions - Bitmask of zero or more permission flags.
* @property {property} properties - Bitmask of zero or more property flags.
* @property {writeType} writeType
* @property {readRequestCallback} onReadRequest
* @property {writeRequestCallback} onWriteRequest
* @property {Array} descriptors - Optional. An array of GattDescriptor objects.
*/

/** Describes a GATT descriptor.
* @typedef {Object} GattDescriptor
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {module:cordova-plugin-ble.permission} permissions - Bitmask of zero or more permission flags.
* @property {readRequestCallback} onReadRequest
* @property {writeRequestCallback} onWriteRequest
*/


// GattServer callbacks
/** This function is a part of GattSettings and is called when a remote device connects to, or disconnects from, your server.
* @callback connectionStateChangeCallback
* @param {int} deviceHandle - Will be used in other callbacks.
* @param {boolean} connected - If true, the device just connected, and the handle is now valid for use in close() and other functions.
* If false, it just disconnected, and the handle is now invalid for use in close() and other functions.
*/

/** Called when a remote device asks to read a characteristic or descriptor.
* You must call sendResponse() to complete the request.
* @callback readRequestCallback
* @param {int} deviceHandle
* @param {int} requestId
*/

/** Called when a remote device asks to write a characteristic or descriptor.
* You must call sendResponse() to complete the request.
* @callback writeRequestCallback
* @param {int} deviceHandle
* @param {int} requestId
* @param {ArrayBuffer} data
*/


/** Stops the GATT server.
* This stops any active advertisements and forcibly disconnects any clients.
* There can be only one server. If startGattServer() returned success, you may call this function once.
* Calling it more will result in failure.
*
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.peripheral.stopGattServer = function(win, fail) {
	exec(win, fail, 'BLE', 'stopGattServer', []);
};

/** Sends a response to a read or write request.
* @param {int} deviceHandle - From a requestCallback.
* @param {int} requestId - From the same requestCallback as deviceHandle.
* @param {ArrayBufferView} data - Required for responses to read requests. May be set to null for write requests.
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.peripheral.sendResponse = function(deviceHandle, requestId, data, win, fail) {
	exec(win, fail, 'BLE', 'sendResponse', [deviceHandle, requestId, data.buffer]);
}

/** Sends a notification to a remote device that a characteristic's value has been updated.
* @param {int} deviceHandle - From a connectionStateChangeCallback.
* @param {int} characteristicHandle - GattCharacteristic.handle
* @param {ArrayBufferView} data - The characteristic's new value.
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.peripheral.notify = function(deviceHandle, characteristic, data, win, fail) {
	exec(win, fail, 'BLE', 'notify', [deviceHandle, characteristic, data.buffer]);
};

/*	// never mind, just use close().
// Closes a client handle, freeing the resources.
exports.closeClient = function(clientHandle, win, fail) {
};
*/


/** Starts BLE advertise.
* Fails if advertise is running. In that case, call stopAdvertise first.
*
* @param {AdvertiseSettings} settings
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.peripheral.startAdvertise = function(settings, win, fail) {
	exec(win, fail, 'BLE', 'startAdvertise', [settings]);
}

/** Stops BLE advertise.
*
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.peripheral.stopAdvertise = function(win, fail) {
	exec(win, fail, 'BLE', 'stopAdvertise', []);
}

// AdvertiseSettings
/** Describes a BLE advertisement.
*
* All the properties are optional, except broadcastData.
*
* @typedef {Object} AdvertiseSettings
* @property {string} advertiseMode - ADVERTISE_MODE_LOW_POWER, ADVERTISE_MODE_BALANCED, or ADVERTISE_MODE_LOW_LATENCY.
* The default is ADVERTISE_MODE_LOW_POWER.
* @property {boolean} connectable - Advertise as connectable or not. Has no bearing on whether the device is actually connectable.
* The default is true if there is a GattServer running, false if there isn't.
* @property {int} timeoutMillis - Advertising time limit. May not exceed 180000 milliseconds. A value of 0 will disable the time limit.
* The default is 0.
* @property {string} txPowerLevel - ADVERTISE_TX_POWER_ULTRA_LOW, ADVERTISE_TX_POWER_LOW, ADVERTISE_TX_POWER_MEDIUM or ADVERTISE_TX_POWER_HIGH.
* The default is ADVERTISE_TX_POWER_MEDIUM.
* @property {AdvertiseData} broadcastData - The data which will be broadcast. Passive scanners will see this data.
* @property {AdvertiseData} scanResponseData - The data with which the device will respond to active scans.
* Should be an extension to the broadcastData; should not contain the same data.
*/

/** Describes BLE advertisement data.
*
* Data size is limited to 31 bytes. Each property set consumes some bytes.
* If too much data is added, startAdvertise will fail with "ADVERTISE_FAILED_DATA_TOO_LARGE" or something similar.
*
* All properties are optional.
* UUIDs must be formatted according to RFC 4122, all lowercase.
* Normally, UUIDs take up 16 bytes. However, UUIDs that use the Bluetooth Base format can be compressed to 4 or 2 bytes.
* The Bluetooth Base UUID is "00000000-0000-1000-8000-00805f9b34fb".
* For 2 bytes, use this format, where "x" is any hexadecimal digit: "0000xxxx-0000-1000-8000-00805f9b34fb".
* For 4 bytes, use this format: "xxxxxxxx-0000-1000-8000-00805f9b34fb".
*
* @typedef {Object} AdvertiseData
* @property {boolean} includeDeviceName - If true, the device's Bluetooth name is added to the advertisement.
* The name is set by the user in the device's Settings. The name cannot be changed by the app.
* The default is false.
* @property {boolean} includeTxPowerLevel - If true, the txPowerLevel found in AdvertiseSettings is added to the advertisement.
* The default is false.
* @property {Array} serviceUUIDs - Array of strings. Each string is the UUID of a service that should be available in the device's GattServer.
* @property {Object} serviceData - Map of string to string. Each key is a service UUID.
* The value is base64-encoded data associated with the service.
* @property {Object} manufacturerData - Map of int to string. Each key is a manufacturer ID.
* Manufacturer IDs are assigned by the {@link http://www.bluetooth.com/|Bluetooth Special Interest Group}.
* The value is base64-encoded data associated with the manufacturer.
*/

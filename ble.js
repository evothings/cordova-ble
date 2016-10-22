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

// Flag that tracks if scanning is in progress.
//  Used by startScan and stopScan.
var isScanning = false;

/**
 * Start scanning for devices.
 * <p>An array of service UUID strings may be given in the options object parameter.
 * One or more service UUIDs must be specified for iOS background scanning to work.</p>
 * <p>Found devices and errors are reported to the supplied callback functions.</p>
 * <p>Will keep scanning until you call stopScan().</p>
 * <p>To conserve energy, call stopScan() as soon as you've found the device
 * you're looking for.</p>
 * <p>Call stopScan() before calling startScan() again.</p>
 *
 * @param {scanCallback} success - Success callback, called repeatedly
 * for each found device.
 * @param {failCallback} fail - Error callback.
 * @param {ScanOptions} options - Optional object with options.
 * Set field serviceUUIDs to an array of service UUIDs to scan for.
 * Set field parseAdvertisementData to false to disable automatic
 * parsing of advertisement data.
 *
 * @example
 *   // Scan for all services.
 *   evothings.ble.startScan(
 *       function(device)
 *       {
 *           console.log('startScan found device named: ' + device.name);
 *       },
 *       function(errorCode)
 *       {
 *           console.log('startScan error: ' + errorCode);
 *       }
 *   );
 *
 *   // Scan for specific service (Eddystone Service UUID).
 *   evothings.ble.startScan(
 *       function(device)
 *       {
 *           console.log('startScan found device named: ' + device.name);
 *       },
 *       function(errorCode)
 *       {
 *           console.log('startScan error: ' + errorCode);
 *       },
 *       { serviceUUIDs: ['0000feaa-0000-1000-8000-00805f9b34fb'] }
 *   );
 */
exports.startScan = function(arg1, arg2, arg3, arg4)
{
	// Scanning parameters.
	var serviceUUIDs;
	var success;
	var fail;
	var options;
	var parseAdvertisementData = true;

	function onFail(error)
	{
		isScanning = false;
		fail(error);
	}

	function onSuccess(device)
	{
		// Only report results while scanning is requested.
		if (isScanning)
		{
			if (parseAdvertisementData)
			{
				exports.parseAdvertisementData(device);
			}
			success(device);
		}
	}

	// Determine parameters.
	if (Array.isArray(arg1))
	{
		// First param is an array of serviceUUIDs.
		serviceUUIDs = arg1;
		success = arg2;
		fail = arg3;
		options = arg4;
	}
	else if ('function' == typeof arg1)
	{
		// First param is a function.
		serviceUUIDs = null;
		success = arg1;
		fail = arg2;
		options = arg3;
	}

	if (isScanning)
	{
		fail('Scan already in progress');
		return;
	}

	isScanning = true;

	// Set options.
	if (options)
	{
		if (Array.isArray(options.serviceUUIDs))
		{
			serviceUUIDs = options.serviceUUIDs;
		}

		if (options.parseAdvertisementData === true)
		{
			parseAdvertisementData = true;
		}
		else if (options.parseAdvertisementData === false)
		{
			parseAdvertisementData = false;
		}
	}

	// Start scanning.
	isScanning = true;
	if (Array.isArray(serviceUUIDs))
	{
		serviceUUIDs = getCanonicalUUIDArray(serviceUUIDs);
		exec(onSuccess, onFail, 'BLE', 'startScan', [serviceUUIDs]);
	}
	else
	{
		exec(onSuccess, onFail, 'BLE', 'startScan', []);
	}
};

/**
 * Ensure that all UUIDs in an array has canonical form.
 * @private
 */
function getCanonicalUUIDArray(uuidArray)
{
	var result = [];

	for (var i in uuidArray)
	{
		result.push(exports.getCanonicalUUID(uuidArray[i]));
	}

	return result;
}

/**
 * Options for startScan.
 * @typedef {Object} ScanOptions
 * @param {array} serviceUUIDs - Array with service UUID strings (optional).
 * On iOS multiple UUIDs are scanned for using logical OR operator,
 * any UUID that matches any of the UUIDs adverticed by the device
 * will count as a match. On Android, multiple UUIDs are scanned for
 * using AND logic, the device must advertise all of the given UUIDs
 * to produce a match. (The matching logic will be unified in future
 * versions of the plugin.) When providing one service UUID, behaviour
 * is the same on Android and iOS. Learning out this parameter or
 * setting it to null, will scan for all devices, regardless of
 * advertised services.
 * @property {boolean} parseAdvertisementData - Set to false to disable
 * automatic parsing of advertisement data from the scan record.
 * Default is true.
 */

/**
 * This function is a parameter to startScan() and is called when a new device is discovered.
 * @callback scanCallback
 * @param {DeviceInfo} device
 */

/**
 * Info about a BLE device.
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

/**
 * Information extracted from a scanRecord. Some or all of the fields may
 * be undefined. This varies between BLE devices.
 * Depending on OS version and BLE device, additional fields, not documented
 * here, may be present.
 * @typedef {Object} AdvertisementData
 * @property {string} kCBAdvDataLocalName - The device's name. Might or might
 * not be equal to DeviceInfo.name. iOS caches DeviceInfo.name which means if
 * the name is changed on the device, the new name might not be visible.
 * kCBAdvDataLocalName is not cached and is therefore safer to use, when available.
 * @property {number} kCBAdvDataTxPowerLevel - Transmission power level as
 * advertised by the device.
 * @property {number} kCBAdvDataChannel - A positive integer, the BLE channel
 * on which the device listens for connections. Ignore this number.
 * @property {boolean} kCBAdvDataIsConnectable - True if the device accepts
 * connections. False if it doesn't.
 * @property {array} kCBAdvDataServiceUUIDs - Array of strings, the UUIDs of
 * services advertised by the device. Formatted according to RFC 4122, all lowercase.
 * @property {object} kCBAdvDataServiceData - Dictionary of strings to strings.
 * The keys are service UUIDs. The values are base-64-encoded binary data.
 * @property {string} kCBAdvDataManufacturerData - Base-64-encoded binary data.
 * This field is used by BLE devices to advertise custom data that don't fit into
 * any of the other fields.
 */

/**
 * This function is called when an operation fails.
 * @callback failCallback
 * @param {string} errorString - A human-readable string that describes the error that occurred.
 */

/**
 * Stops scanning for devices.
 *
 * @example
 *   evothings.ble.stopScan();
 */
exports.stopScan = function()
{
	isScanning = false;
	exec(null, null, 'BLE', 'stopScan', []);
};

// Create closure for parseAdvertisementData and helper functions.
// TODO: Investigate if the code can be simplified, compare to how
// how the Evothings Bleat implementation does this.
;(function()
{
var base64;

/**
 * Parse the advertisement data in the scan record.
 * If device already has AdvertisementData, does nothing.
 * If device instead has scanRecord, creates AdvertisementData.
 * See  {@link AdvertisementData} for reference documentation.
 * @param {DeviceInfo} device - Device object.
 */
exports.parseAdvertisementData = function(device)
{
	if (!base64) { base64 = cordova.require('cordova/base64'); }

	// If device object already has advertisementData we
	// do not need to parse the scanRecord.
	if (device.advertisementData) { return; }

	// Must have scanRecord yo continue.
	if (!device.scanRecord) { return; }

	// Here we parse BLE/GAP Scan Response Data.
	// See the Bluetooth Specification, v4.0, Volume 3, Part C, Section 11,
	// for details.

	var byteArray = base64DecToArr(device.scanRecord);
	var pos = 0;
	var advertisementData = {};
	var serviceUUIDs;
	var serviceData;

	// The scan record is a list of structures.
	// Each structure has a length byte, a type byte, and (length-1) data bytes.
	// The format of the data bytes depends on the type.
	// Malformed scanRecords will likely cause an exception in this function.
	while (pos < byteArray.length)
	{
		var length = byteArray[pos++];
		if (length == 0)
		{
			break;
		}
		length -= 1;
		var type = byteArray[pos++];

		// Parse types we know and care about.
		// Skip other types.

		var BLUETOOTH_BASE_UUID = '-0000-1000-8000-00805f9b34fb'

		// Convert 16-byte Uint8Array to RFC-4122-formatted UUID.
		function arrayToUUID(array, offset)
		{
			var k=0;
			var string = '';
			var UUID_format = [4, 2, 2, 2, 6];
			for (var l=0; l<UUID_format.length; l++)
			{
				if (l != 0)
				{
					string += '-';
				}
				for (var j=0; j<UUID_format[l]; j++, k++)
				{
					string += toHexString(array[offset+k], 1);
				}
			}
			return string;
		}

		if (type == 0x02 || type == 0x03) // 16-bit Service Class UUIDs.
		{
			serviceUUIDs = serviceUUIDs ? serviceUUIDs : [];
			for(var i=0; i<length; i+=2)
			{
				serviceUUIDs.push(
					'0000' +
					toHexString(
						littleEndianToUint16(byteArray, pos + i),
						2) +
					BLUETOOTH_BASE_UUID);
			}
		}
		if (type == 0x04 || type == 0x05) // 32-bit Service Class UUIDs.
		{
			serviceUUIDs = serviceUUIDs ? serviceUUIDs : [];
			for (var i=0; i<length; i+=4)
			{
				serviceUUIDs.push(
					toHexString(
						littleEndianToUint32(byteArray, pos + i),
						4) +
					BLUETOOTH_BASE_UUID);
			}
		}
		if (type == 0x06 || type == 0x07) // 128-bit Service Class UUIDs.
		{
			serviceUUIDs = serviceUUIDs ? serviceUUIDs : [];
			for (var i=0; i<length; i+=16)
			{
				serviceUUIDs.push(arrayToUUID(byteArray, pos + i));
			}
		}
		if (type == 0x08 || type == 0x09) // Local Name.
		{
			advertisementData.kCBAdvDataLocalName = evothings.ble.fromUtf8(
				new Uint8Array(byteArray.buffer, pos, length));
		}
		if (type == 0x0a) // TX Power Level.
		{
			advertisementData.kCBAdvDataTxPowerLevel =
				littleEndianToInt8(byteArray, pos);
		}
		if (type == 0x16) // Service Data, 16-bit UUID.
		{
			serviceData = serviceData ? serviceData : {};
			var uuid =
				'0000' +
				toHexString(
					littleEndianToUint16(byteArray, pos),
					2) +
				BLUETOOTH_BASE_UUID;
			var data = new Uint8Array(byteArray.buffer, pos+2, length-2);
			serviceData[uuid] = base64.fromArrayBuffer(data);
		}
		if (type == 0x20) // Service Data, 32-bit UUID.
		{
			serviceData = serviceData ? serviceData : {};
			var uuid =
				toHexString(
					littleEndianToUint32(byteArray, pos),
					4) +
				BLUETOOTH_BASE_UUID;
			var data = new Uint8Array(byteArray.buffer, pos+4, length-4);
			serviceData[uuid] = base64.fromArrayBuffer(data);
		}
		if (type == 0x21) // Service Data, 128-bit UUID.
		{
			serviceData = serviceData ? serviceData : {};
			var uuid = arrayToUUID(byteArray, pos);
			var data = new Uint8Array(byteArray.buffer, pos+16, length-16);
			serviceData[uuid] = base64.fromArrayBuffer(data);
		}
		if (type == 0xff) // Manufacturer-specific Data.
		{
			// Annoying to have to transform base64 back and forth,
			// but it has to be done in order to maintain the API.
			advertisementData.kCBAdvDataManufacturerData =
				base64.fromArrayBuffer(new Uint8Array(byteArray.buffer, pos, length));
		}

		pos += length;
	}
	advertisementData.kCBAdvDataServiceUUIDs = serviceUUIDs;
	advertisementData.kCBAdvDataServiceData = serviceData;
	device.advertisementData = advertisementData;

	/*
	// Log raw data for debugging purposes.

	console.log("scanRecord: "+evothings.util.typedArrayToHexString(byteArray));

	console.log(JSON.stringify(advertisementData));
	*/
};

/**
 * Decodes a Base64 string. Returns a Uint8Array.
 * nBlocksSize is optional.
 * @param {String} sBase64
 * @param {int} nBlocksSize
 * @return {Uint8Array}
 * @public
 */
function base64DecToArr(sBase64, nBlocksSize) {
	var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
	var nInLen = sB64Enc.length;
	var nOutLen = nBlocksSize ?
		Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
		: nInLen * 3 + 1 >> 2;
	var taBytes = new Uint8Array(nOutLen);

	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}

	return taBytes;
}

/**
 * Converts a single Base64 character to a 6-bit integer.
 * @private
 */
function b64ToUint6(nChr) {
	return nChr > 64 && nChr < 91 ?
			nChr - 65
		: nChr > 96 && nChr < 123 ?
			nChr - 71
		: nChr > 47 && nChr < 58 ?
			nChr + 4
		: nChr === 43 ?
			62
		: nChr === 47 ?
			63
		:
			0;
}

/**
 * Returns the integer i in hexadecimal string form,
 * with leading zeroes, such that
 * the resulting string is at least byteCount*2 characters long.
 * @param {int} i
 * @param {int} byteCount
 * @public
 */
function toHexString(i, byteCount) {
	var string = (new Number(i)).toString(16);
	while(string.length < byteCount*2) {
		string = '0'+string;
	}
	return string;
}

/**
 * Interpret byte buffer as unsigned little endian 16 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
function littleEndianToUint16(data, offset)
{
	return (littleEndianToUint8(data, offset + 1) << 8) +
		littleEndianToUint8(data, offset)
}

/**
 * Interpret byte buffer as unsigned little endian 32 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
function littleEndianToUint32(data, offset)
{
	return (littleEndianToUint8(data, offset + 3) << 24) +
		(littleEndianToUint8(data, offset + 2) << 16) +
		(littleEndianToUint8(data, offset + 1) << 8) +
		littleEndianToUint8(data, offset)
}

/**
 * Interpret byte buffer as little endian 8 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
function littleEndianToInt8(data, offset)
{
	var x = littleEndianToUint8(data, offset)
	if (x & 0x80) x = x - 256
	return x
}

/**
 * Interpret byte buffer as unsigned little endian 8 bit integer.
 * Returns converted number.
 * @param {ArrayBuffer} data - Input buffer.
 * @param {number} offset - Start of data.
 * @return Converted number.
 * @public
 */
function littleEndianToUint8(data, offset)
{
	return data[offset]
}

})(); // End of closure for parseAdvertisementData.


/**
 * Success callback function for getBondedDevices.
 * Called with array of bonded devices (may be empty).
 * @callback getBondedDevicesCallback
 * @param {Array} devices - Array of {DeviceInfo} objects. Note that
 * only fields name and address are available in the device info object.
 */

/**
 * Options for getBondedDevices.
 * @typedef {Object} GetBondedDevicesOptions
 * @param {array} serviceUUIDs - Array with or or more service UUID strings (mandatory).
 */

/**
 * Get a list of bonded devices.
 * @param {getBondedDevicesCallback} success - Callback function
 * called with list of bonded devices.
 * @param {failCallback} fail - Error callback function.
 * @param {GetBondedDevicesOptions} options - Mandatory object
 * that specifies service UUIDs to search for.
 * @example
 * evothings.ble.getBondedDevices(
 *     function(devices)
 *     {
 *         console.log('Bonded devices: ' + JSON.stringify(devices));
 *     },
 *     function(errorCode)
 *     {
 *         console.log('getBondedDevices error: ' + errorCode);
 *     },
 *     { serviceUUIDs: ['0000180a-0000-1000-8000-00805f9b34fb'] });
 */
exports.getBondedDevices = function(success, fail, options)
{
	exec(success, fail, 'BLE', 'getBondedDevices', [options.serviceUUIDs]);
}

/**
 * Success callback function for getBondState.
 * @callback getBondStateCallback
 * @param {string} state - The bond state of the device.
 * Possible values are: 'bonded', 'bonding' (Android only),
 * 'unbonded', and 'unknown'.
 */

/**
 * Options for getBondState.
 * @typedef {Object} GetBondStateOptions
 * @param {string} serviceUUID - String with service UUID (mandatory on iOS,
 * ignored on Android).
 */

/**
 * Get bond state for device.
 * @param {DeviceInfo} device - Object with address of the device
 * (a device object that contains just the address field may be used).
 * On iOS the address is a UUID, on Android the address is a MAC address.
 * This value can be found in the device objects obtained using startScan().
 * @param {getBondStateCallback} success - Callback function
 * called with the current bond state (a string).
 * @param {failCallback} fail - Error callback function.
 * @param {GetBondStateOptions} options - Mandatory on iOS where
 * a serviceUUID of the device must be specified. Ignored on Android.
 * @example
 * evothings.ble.getBondState(
 *     { address: uuidOrMacAddress }
 *     function(state)
 *     {
 *         console.log('Bond state: ' + state);
 *     },
 *     function(errorCode)
 *     {
 *         console.log('getBondState error: ' + errorCode);
 *     },
 *     { serviceUUID: '0000180a-0000-1000-8000-00805f9b34fb' });
 */
exports.getBondState = function(device, success, fail, options)
{
	// On iOS we must provide a service UUID.
	var serviceUUID = (options && options.serviceUUID) ? options.serviceUUID : null;

	if (exports.os.isAndroid())
	{
		// On Android we call the native getBondState function.
		// Note that serviceUUID is ignored on Android.
		exec(success, fail, 'BLE', 'getBondState', [device.address, serviceUUID]);
	}
	else
	{
		// On iOS (and other platforms in the future) we get the list of
		// bonded devices and search it.
		exports.getBondedDevices(
			// Success function.
			function(devices)
			{
				for (var i in devices)
				{
					var d = devices[i];
					if (d.address == device.address)
					{
						success("bonded");
						return; // bonded device found
					}
				}
				success("unbonded")
			},
			// Error function.
			function(error)
			{
				success("unknown");
			},
			{ serviceUUIDs: [serviceUUID] }
		);
	}
}

/**
 * Success callback function for bond. On iOS the bond state returned
 * will always be 'unknown' (this function is a NOP on iOS). Note that
 * bonding on Android may fail and then this function is called with
 * 'unbonded' as the new state.
 * @callback bondCallback
 * @param {string} newState - The new bond state of the device.
 * Possible values are: 'bonded' (Android), 'bonding' (Android),
 * 'unbonded' (Android), and 'unknown' (iOS).
 */

/**
 * Bond with device. This function shows a pairing UI on Android.
 * Does nothing on iOS (on iOS paring cannot be requested programatically).
 * @param {DeviceInfo} device - Object with address of the device
 * (a device object that contains just the address field may be used).
 * On iOS the address is a UUID, on Android the address is a MAC address.
 * This value can be found in the device objects obtained using startScan().
 * @param {bondCallback} success - Callback function
 * called with the new bond state (a string). On iOS the result is
 * always 'unknown'.
 * @param {failCallback} fail - Error callback function.
 * @example
 * evothings.ble.bond(
 *     { address: uuidOrMacAddress }
 *     function(newState)
 *     {
 *         console.log('New bond state: ' + newState);
 *     },
 *     function(errorCode)
 *     {
 *         console.log('bond error: ' + errorCode);
 *     });
 */
exports.bond = function(device, success, fail)
{
	exec(success, fail, 'BLE', 'bond', [device.address]);
}

/**
 * Success callback function for unbond. On iOS the bond state returned
 * will always be 'unknown' (this function is a NOP on iOS). On Anroid
 * the result should be 'unbonded', but other states are possible. Check
 * the state to make sure the function was successful.
 * @callback unbondCallback
 * @param {string} newState - The new bond state of the device.
 * Possible values are: 'unbonded' (Android), 'bonding' (Android),
 * 'bonded' (Android), and 'unknown' (iOS).
 */

/**
 * Unbond with device. This function does nothing on iOS.
 * @param {DeviceInfo} device - Object with address of the device
 * (a device object that contains just the address field may be used).
 * On iOS the address is a UUID, on Android the address is a MAC address.
 * This value can be found in the device objects obtained using startScan().
 * @param {unbondCallback} success - Callback function
 * called with the new bond state (a string). On iOS the result is
 * always 'unknown'.
 * @param {failCallback} fail - Error callback function.
 * @example
 * evothings.ble.unbond(
 *     { address: uuidOrMacAddress }
 *     function(newState)
 *     {
 *         console.log('New bond state: ' + newState);
 *     },
 *     function(errorCode)
 *     {
 *         console.log('bond error: ' + errorCode);
 *     });
 */
exports.unbond = function(device, success, fail)
{
	exec(success, fail, 'BLE', 'unbond', [device.address]);
}

/**
 * Connect to a remote device. It is recommended that you use the high-level
 * function {evothings.ble.connectToDevice} in place of this function.
 * On Android connect may fail with error 133. If this happens, wait about 500ms
 * and connect again.
 * @param {DeviceInfo} device - Device object from scanCallback (for backwards
 * compatibility, this parameter may also be the address string of the device object).
 * @param {connectCallback} success
 * @param {failCallback} fail
 * @example
 * evothings.ble.connect(
 *     device,
 *     function(connectInfo)
 *     {
 *         console.log('Connect status for device: '
 *             + connectInfo.device.name
 *             + ' state: '
 *             + connectInfo.state);
 *     },
 *     function(errorCode)
 *     {
 *         console.log('Connect error: ' + errorCode);
 *     });
 */
exports.connect = function(deviceOrAddress, success, fail)
{
	if (typeof deviceOrAddress == 'string')
	{
		var address = deviceOrAddress;
		exec(success, fail, 'BLE', 'connect', [address]);
	}
	else
	if (typeof deviceOrAddress == 'object')
	{
		var device = deviceOrAddress;
		function onSuccess(connectInfo)
		{
			connectInfo.device = device;
			device.handle = connectInfo.deviceHandle;
			success(connectInfo);
		}
		exec(onSuccess, fail, 'BLE', 'connect', [device.address]);
	}
	else
	{
		fail('Invalid first argument');
	}
};

/**
 * Will be called whenever the device's connection state changes.
 * @callback connectCallback
 * @param {ConnectInfo} info
 */

/**
 * Info about connection events and state.
 * @typedef {Object} ConnectInfo
 * @property {DeviceInfo} device - The device object is available in the
 * ConnectInfo if a device object was passed to connect; passing the address
 * string to connect is allowed for backwards compatibility, but this does not
 * set the device field.
 * @property {number} deviceHandle - Handle to the device.
 * @property {number} state - One of the {@link module:cordova-plugin-ble.connectionState} keys.
 */

/**
 * A map describing possible connection states.
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

/**
 * Connect to a BLE device and discover services. This is a more high-level
 * function than {evothings.ble.connect}. You can configure which services
 * to discover and also turn off automatic service discovery by supplying
 * an options parameter.
 * On Android connect may fail with error 133. If this happens, wait about 500ms
 * and connect again.
 * @param {DeviceInfo} device - Device object from {scanCallback}.
 * @param {connectedCallback} connected - Called when connected to the device.
 * @param {disconnectedCallback} disconnected - Called when disconnected from the device.
 * @param {failCallback} fail - Called on error.
 * @param {ConnectOptions} options - Optional connect options object.
 * @example
 *   evothings.ble.connectToDevice(
 *     device,
 *     function(device)
 *     {
 *       console.log('Connected to device: ' + device.name);
 *     },
 *     function(device)
 *     {
 *       console.log('Disconnected from device: ' + device.name);
 *     },
 *     function(errorCode)
 *     {
 *       console.log('Connect error: ' + errorCode);
 *     });
 */
exports.connectToDevice = function(device, connected, disconnected, fail, options)
{
	// Default options.
	var discoverServices = true;
	var serviceUUIDs = null;

	// Set options.
	if (options && (typeof options == 'object'))
	{
		if (options.discoverServices === false)
		{
			discoverServices = false;
		}

		if (Array.isArray(options.serviceUUIDs))
		{
			serviceUUIDs = options.serviceUUIDs;
		}
	}

	function onConnectEvent(connectInfo)
	{
		if (connectInfo.state == evothings.ble.connectionState.STATE_CONNECTED)
		{
			device.handle = connectInfo.deviceHandle;
			if (discoverServices)
			{
				// Read services, characteristics and descriptors.
				// device.services is set by readServiceData to
				// the resulting services array.
				evothings.ble.readServiceData(
					device,
					function readServicesSuccess(services)
					{
						// Notify connected callback.
						connected(device);
					},
					fail,
					{ serviceUUIDs: serviceUUIDs });
			}
			else
			{
				// Call connected callback without auto discovery of services.
				connected(device);
			}
		}
		else if (connectInfo.state == evothings.ble.connectionState.STATE_DISCONNECTED)
		{
			// Call disconnected callback.
			disconnected(device);
		}

    }

    // Connect to device.
	exec(onConnectEvent, fail, 'BLE', 'connect', [device.address]);
};

/**
 * Options for connectToDevice.
 * @typedef {Object} ConnectOptions
 * @property {boolean} discoverServices - Set to false to disable
 * automatic service discovery. Default is true.
 * @property {array} serviceUUIDs - Array with service UUID strings for
 * services to discover (optional). If empty or null, all services are
 * read, this is the default.
 */

/**
 * Get the handle of an object. If a handle is passed return it.
 * Allows to pass in either an object or a handle to API functions.
 * @private
 */
function objectHandle(objectOrHandle)
{
	if ((typeof objectOrHandle == 'object') && objectOrHandle.handle)
	{
		// It's an object, return the handle.
		return objectOrHandle.handle;
	}
	else
	{
		// It's a handle.
		return objectOrHandle;
	}
}

/**
 * Close the connection to a remote device.
 * <p>Frees any native resources associated with the device.
 * <p>Does not cause any callbacks to the function passed to connect().
 *
 * @param {DeviceInfo} device - Device object or a device handle
 * from {@link connectCallback}.
 * @example
 *   evothings.ble.close(device);
 */
exports.close = function(deviceOrHandle)
{
	exec(null, null, 'BLE', 'close', [objectHandle(deviceOrHandle)]);
};

/**
 * Fetch the remote device's RSSI (signal strength).
 * @param {DeviceInfo} device - Device object or a device handle from {@link connectCallback}.
 * @param {rssiCallback} success
 * @param {failCallback} fail
 * @example
 *   evothings.ble.rssi(
 *     device,
 *     function(rssi)
 *     {
 *       console.log('rssi: ' + rssi);
 *     },
 *     function(errorCode)
 *     {
 *       console.log('rssi error: ' + errorCode);
 *     });
 */
exports.rssi = function(deviceOrHandle, success, fail)
{
	exec(deviceOrHandle, success, fail, 'BLE', 'rssi', [objectHandle(deviceOrHandle)]);
};

/**
 * This function is called with an RSSI value.
 * @callback rssiCallback
 * @param {number} rssi - A negative integer, the signal strength in decibels.
 */

/**
 * Fetch information about a remote device's services.
 * @param {DeviceInfo} device - Device object or a device handle from {@link connectCallback}.
 * @param {serviceCallback} success - Called with array of {@link Service} objects.
 * @param {failCallback} fail
 * @example
 *     evothings.ble.services(
 *     device,
 *     function(services)
 *     {
 *       console.log('found services:');
 *       for (var i = 0; i < services.length; i++)
 *       {
 *         var service = services[i];
 *         console.log('  service:');
 *         console.log('    ' + service.handle);
 *         console.log('    ' + service.uuid);
 *         console.log('    ' + service.serviceType);
 *       }
 *     },
 *     function(errorCode)
 *     {
 *       console.log('services error: ' + errorCode);
 *     });
 */
exports.services = function(deviceOrHandle, success, fail)
{
	exec(success, fail, 'BLE', 'services', [objectHandle(deviceOrHandle)]);
};

/**
 * @callback serviceCallback
 * @param {Array} services - Array of {@link Service} objects.
 */

/**
 * Describes a GATT service.
 * @typedef {Object} Service
 * @property {number} handle
 * @property {string} uuid - Formatted according to RFC 4122, all lowercase.
 * @property {module:cordova-plugin-ble.serviceType} type
 */

/**
 * A map describing possible service types.
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
 * @param {DeviceInfo} device - Device object or a device handle from {@link connectCallback}.
 * @param {Service} service - Service object or handle from {@link serviceCallback}.
 * @param {characteristicCallback} success - Called with array of {@link Characteristic} objects.
 * @param {failCallback} fail
 * @example
 *   evothings.ble.characteristics(
 *     device,
 *     service,
 *     function(characteristics)
 *     {
 *       console.log('found characteristics:');
 *       for (var i = 0; i < characteristics.length; i++)
 *       {
 *         var characteristic = characteristics[i];
 *         console.log('  characteristic: ' + characteristic.uuid);
 *       }
 *     },
 *     function(errorCode)
 *     {
 *       console.log('characteristics error: ' + errorCode);
 *     });
 */
exports.characteristics = function(deviceOrHandle, serviceOrHandle, success, fail)
{
	exec(success, fail, 'BLE', 'characteristics',
		[objectHandle(deviceOrHandle),
		 objectHandle(serviceOrHandle)]);
};

/**
 * @callback characteristicCallback
 * @param {Array} characteristics - Array of {@link Characteristic} objects.
 */

/**
 * Describes a GATT characteristic.
 * @typedef {Object} Characteristic
 * @property {number} handle
 * @property {string} uuid - Formatted according to RFC 4122, all lowercase.
 * @property {module:cordova-plugin-ble.permission} permissions - Bitmask of
 * zero or more permission flags.
 * @property {module:cordova-plugin-ble.property} properties - Bitmask of
 * zero or more property flags.
 * @property {module:cordova-plugin-ble.writeType} writeType
 */

/**
 * A map describing possible permission flags.
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

/**
 * A map describing possible property flags.
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

/**
 * A map describing possible write types.
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

/**
 * Fetch information about a characteristic's descriptors.
 * @param {DeviceInfo} device - Device object or a device handle from
 * {@link connectCallback}.
 * @param {Characteristic} characteristic - Characteristic object or handle
 * from {@link characteristicCallback}.
 * @param {descriptorCallback} success - Called with array of {@link Descriptor} objects.
 * @param {failCallback} fail
 * @example
 *   evothings.ble.descriptors(
 *     device,
 *     characteristic,
 *     function(descriptors)
 *     {
 *       console.log('found descriptors:');
 *       for (var i = 0; i < descriptors.length; i++)
 *       {
 *         var descriptor = descriptors[i];
 *         console.log('  descriptor: ' + descriptor.uuid);
 *       }
 *     },
 *     function(errorCode)
 *     {
 *       console.log('descriptors error: ' + errorCode);
 *     });
 */
exports.descriptors = function(deviceOrHandle, characteristicOrHandle, success, fail)
{
	exec(success, fail, 'BLE', 'descriptors',
		[objectHandle(deviceOrHandle),
		 objectHandle(characteristicOrHandle)]);
};

/**
 * @callback descriptorCallback
 * @param {Array} descriptors - Array of {@link Descriptor} objects.
 */

/**
 * Describes a GATT descriptor.
 * @typedef {Object} Descriptor
 * @property {number} handle
 * @property {string} uuid - Formatted according to RFC 4122, all lowercase.
 * @property {module:cordova-plugin-ble.permission} permissions - Bitmask of
 * zero or more permission flags.
 */

/**
 * @callback dataCallback
 * @param {ArrayBuffer} data
 */

/**
 * Reads a characteristic's value from a remote device.
 * @param {DeviceInfo} device - Device object or a device handle from
 * {@link connectCallback}.
 * @param {Characteristic} characteristic - Characteristic object or handle
 * from {@link characteristicCallback}.
 * @param {dataCallback} success
 * @param {failCallback} fail
 * @example
 *   evothings.ble.readCharacteristic(
 *     device,
 *     characteristic,
 *     function(data)
 *     {
 *       console.log('characteristic data: ' + evothings.ble.fromUtf8(data));
 *     },
 *     function(errorCode)
 *     {
 *       console.log('readCharacteristic error: ' + errorCode);
 *     });
 */
exports.readCharacteristic = function(deviceOrHandle, characteristicOrHandle, success, fail)
{
	exec(success, fail, 'BLE', 'readCharacteristic',
		[objectHandle(deviceOrHandle),
		 objectHandle(characteristicOrHandle)]);
};

/**
 * Reads a descriptor's value from a remote device.
 * @param {DeviceInfo} device - Device object or a device handle from {@link connectCallback}.
 * @param {Descriptor} descriptor - Descriptor object or handle from {@link descriptorCallback}.
 * @param {dataCallback} success
 * @param {failCallback} fail
 * @example
 * evothings.ble.readDescriptor(
 *   device,
 *   descriptor,
 *   function(data)
 *   {
 *     console.log('descriptor data: ' + evothings.ble.fromUtf8(data));
 *   },
 *   function(errorCode)
 *   {
 *     console.log('readDescriptor error: ' + errorCode);
 *   });
 */
exports.readDescriptor = function(deviceOrHandle, descriptorOrHandle, success, fail)
{
	exec(success, fail, 'BLE', 'readDescriptor',
		[objectHandle(deviceOrHandle),
		 objectHandle(descriptorOrHandle)]);
};

/**
 * @callback emptyCallback - Callback that takes no parameters.
 * This callback indicates that an operation was successful,
 * without specifying and additional information.
 */

/**
 * Write a characteristic's value to the remote device.
 *
 * Writes with response, the remote device sends back a confirmation message.
 * This is safe but slower than writing without response.
 *
 * @param {DeviceInfo} device - Device object or a device handle from
 * {@link connectCallback}.
 * @param {Characteristic} characteristic - Characteristic object or handle
 * from {@link characteristicCallback}.
 * @param {ArrayBufferView} data - The value to be written.
 * @param {emptyCallback} success - Called when the remote device has
 * confirmed the write.
 * @param {failCallback} fail - Called if the operation fails.
 * @example TODO: Add example.
 */
exports.writeCharacteristic = function(deviceOrHandle, characteristicOrHandle, data, success, fail)
{
	exec(success, fail, 'BLE', 'writeCharacteristic',
		[objectHandle(deviceOrHandle),
		 objectHandle(characteristicOrHandle),
		 data.buffer]);
};

/**
 * Write a characteristic's value without response.
 *
 * Asks the remote device to NOT send a confirmation message.
 * This may be used for increased data throughput.
 *
 * If the application needs to ensure data integrity, a separate safety protocol
 * would be required. Design of such protocols is beyond the scope of this document.
 *
 * @param {DeviceInfo} device - Device object or a device handle from
 * {@link connectCallback}.
 * @param {Characteristic} characteristic - Characteristic object or handle
 * from {@link characteristicCallback}.
 * @param {ArrayBufferView} data - The value to be written.
 * @param {emptyCallback} success - Called when the data has been sent.
 * @param {failCallback} fail - Called if the operation fails.
 */
exports.writeCharacteristicWithoutResponse = function(deviceOrHandle, characteristicOrHandle, data, success, fail)
{
	exec(success, fail, 'BLE', 'writeCharacteristicWithoutResponse',
		[objectHandle(deviceOrHandle),
		 objectHandle(characteristicOrHandle),
		 data.buffer]);
};

/**
 * Write a descriptor's value to a remote device.
 * @param {DeviceInfo} device - Device object or a device handle from {@link connectCallback}.
 * @param {Descriptor} descriptor - Descriptor object or handle from {@link descriptorCallback}.
 * @param {ArrayBufferView} data - The value to be written.
 * @param {emptyCallback} success
 * @param {failCallback} fail
 * @example TODO: Add example.
 */
exports.writeDescriptor = function(deviceOrHandle, descriptorOrHandle, data, success, fail)
{
	exec(success, fail, 'BLE', 'writeDescriptor',
		[objectHandle(deviceOrHandle),
		 objectHandle(descriptorOrHandle),
		 data.buffer]);
};

/**
 * Request notification or indication on changes to a characteristic's value.
 * This is more efficient than polling the value using readCharacteristic().
 * This function automatically detects if the characteristic supports
 * notification or indication.
 *
 * <p>Android only: To disable this functionality and write
 * the configuration descriptor yourself, supply an options object as
 * last parameter, see example below.</p>
 *
 * @param {DeviceInfo} device - Device object or a device handle from
 * {@link connectCallback}.
 * @param {Characteristic} characteristic - Characteristic object or handle
 * from {@link characteristicCallback}.
 * @param {dataCallback} success - Called every time the value changes.
 * @param {failCallback} fail - Error callback.
 * @param {NotificationOptions} options - Android only: Optional object with options.
 * Set field writeConfigDescriptor to false to disable automatic writing of
 * notification or indication descriptor value. This is useful if full control
 * of writing the config descriptor is needed.
 *
 * @example
 *   // Example call:
 *   evothings.ble.enableNotification(
 *     device,
 *     characteristic,
 *     function(data)
 *     {
 *       console.log('characteristic data: ' + evothings.ble.fromUtf8(data));
 *     },
 *     function(errorCode)
 *     {
 *       console.log('enableNotification error: ' + errorCode);
 *     });
 *
 *   // To disable automatic writing of the config descriptor
 *   // supply this as last parameter to enableNotification:
 *   { writeConfigDescriptor: false }
 */
exports.enableNotification = function(deviceOrHandle, characteristicOrHandle, success, fail, options)
{
	var flags = 0;
	if (options && (false === options.writeConfigDescriptor))
	{
		var flags = 1; // Don't write config descriptor.
	}
	exec(success, fail, 'BLE', 'enableNotification',
		[objectHandle(deviceOrHandle),
		 objectHandle(characteristicOrHandle),
		 flags]);
};

/**
 * Disable notification or indication of a characteristic's value.
 *
 * @param {DeviceInfo} device - Device object or a device handle from
 * {@link connectCallback}.
 * @param {Characteristic} characteristic - Characteristic object or handle
 * from {@link characteristicCallback}.
 * @param {emptyCallback} success - Success callback.
 * @param {failCallback} fail - Error callback.
 * @param {NotificationOptions} options - Android only: Optional object with options.
 * Set field writeConfigDescriptor to false to disable automatic writing of
 * notification or indication descriptor value. This is useful if full control
 * of writing the config descriptor is needed.
 *
 * @example
 *   // Example call:
 *   evothings.ble.disableNotification(
 *     device,
 *     characteristic,
 *     function()
 *     {
 *       console.log('characteristic notification disabled');
 *     },
 *     function(errorCode)
 *     {
 *       console.log('disableNotification error: ' + errorCode);
 *     });
 *
 *   // To disable automatic writing of the config descriptor
 *   // supply this as last parameter to enableNotification:
 *   { writeConfigDescriptor: false }
 */
exports.disableNotification = function(deviceOrHandle, characteristicOrHandle, success, fail, options) {
	var flags = 0;
	if (options && (false === options.writeConfigDescriptor))
	{
		var flags = 1; // Don't write config descriptor.
	}
	exec(success, fail, 'BLE', 'disableNotification',
		[objectHandle(deviceOrHandle),
		 objectHandle(characteristicOrHandle),
		 flags]);
};

/**
 * Options for enableNotification and disableNotification.
 * @typedef {Object} NotificationOptions
 * @property {boolean} writeConfigDescriptor - set to false to disable
 * automatic writing of the notification or indication descriptor.
 * This is useful if full control of writing the config descriptor is needed.
 */

/**
 * i is an integer. It is converted to byte and put in an array[1].
 * The array is returned.
 * <p>assert(string.charCodeAt(0) == i).
 *
 * @param {number} i
 * @param {dataCallback} success - Called every time the value changes.
 */
exports.testCharConversion = function(i, success)
{
	exec(success, null, 'BLE', 'testCharConversion', [i]);
};

/**
 * Resets the device's Bluetooth system.
 * This is useful on some buggy devices where BLE functions stops responding until reset.
 * Available on Android 4.3+. This function takes 3-5 seconds to reset BLE.
 * On iOS this function stops any ongoing scan operation and disconnects
 * all connected devices.
 *
 * @param {emptyCallback} success
 * @param {failCallback} fail
 */
exports.reset = function(success, fail)
{
	exec(success, fail, 'BLE', 'reset', []);
};

/**
 * Converts an ArrayBuffer containing UTF-8 data to a JavaScript String.
 * @param {ArrayBuffer} a
 * @returns string
 */
exports.fromUtf8 = function(a)
{
	return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(a))));
};

/**
 * Converts a JavaScript String to an Uint8Array containing UTF-8 data.
 * @param {string} s
 * @returns Uint8Array
 */
exports.toUtf8 = function(s)
{
	var strUtf8 = unescape(encodeURIComponent(s));
	var ab = new Uint8Array(strUtf8.length);
	for (var i = 0; i < strUtf8.length; i++)
	{
		ab[i] = strUtf8.charCodeAt(i);
	}
	return ab;
};

/**
 * Returns a canonical UUID.
 *
 * Code adopted from the Bleat library by Rob Moran (@thegecko), see this file:
 * https://github.com/thegecko/bleat/blob/master/dist/bluetooth.helpers.js
 *
 * @param {string|number} uuid - The UUID to turn into canonical form.
 * @return Canonical UUID.
 */
exports.getCanonicalUUID = function(uuid)
{
	if (typeof uuid === 'number')
	{
		uuid = uuid.toString(16);
	}

	uuid = uuid.toLowerCase();

	if (uuid.length <= 8)
	{
		uuid = ('00000000' + uuid).slice(-8) + '-0000-1000-8000-00805f9b34fb';
	}

	if (uuid.length === 32)
	{
		uuid = uuid
			.match(/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/)
			.splice(1)
			.join('-');
	}

	return uuid;
};

/**
 * Read all services, and associated characteristics and descriptors
 * for the given device.
 *
 * This function is an easy-to-use wrapper of the low-level functions
 * ble.services(), ble.characteristics() and ble.descriptors().
 *
 * @param {DeviceInfo} device - Device object or device handle
 * from {@link connectCallback}.
 * @param {serviceCallback} success - Called with array of {@link Service} objects.
 * Those Service objects each have an additional field "characteristics",
 * which is an array of {@link Characteristic} objects.
 * Those Characteristic objects each have an additional field "descriptors",
 * which is an array of {@link Descriptor} objects.
 * @param {failCallback} fail - Error callback.
 */
exports.readAllServiceData = function(deviceOrHandle, success, fail)
{
	exports.readServiceData(deviceOrHandle, success, fail);
}

/**
 * Options for readServiceData.
 * @typedef {Object} ReadServiceDataOptions
 * @property {array} serviceUUIDs - Array with service UUID strings for
 * services to discover (optional). If absent or null, all services are
 * read, this is the default.
 */

/**
 * Read services, and associated characteristics and descriptors
 * for the given device. Which services to read may be specified
 * in the options parameter. Leaving out the options parameter
 * with read all services.
 *
 * @param {DeviceInfo} device - Device object or device handle
 * from {@link connectCallback}.
 * @param {serviceCallback} success - Called with array of {@link Service} objects.
 * Those Service objects each have an additional field "characteristics",
 * which is an array of {@link Characteristic} objects.
 * Those Characteristic objects each have an additional field "descriptors",
 * which is an array of {@link Descriptor} objects.
 * @param {failCallback} fail - Error callback.
 * @param {ReadServiceDataOptions} options - Object with options
 * (optional parameter). If left out, all services are read.
 */
exports.readServiceData = function(deviceOrHandle, success, fail, options)
{
	// Set options.
	var serviceUUIDs = null;
	if (options && Array.isArray(options.serviceUUIDs))
	{
		serviceUUIDs = getCanonicalUUIDArray(options.serviceUUIDs);
	}

	// Array of populated services.
	var serviceArray = [];

	// Counter that tracks the number of info items read.
	// This value is incremented and decremented when reading.
	// When value is back to zero, all items are read.
	var readCounter = 0;

	function includeService(service)
	{
		if (serviceUUIDs)
		{
			// Include service only if in array.
			return serviceUUIDs.indexOf(service.uuid) > -1;
		}
		else
		{
			// Include all services.
			return true;
		}
	}

	function servicesCallbackFun()
	{
		return function(services)
		{
			readCounter += services.length;
			for (var i = 0; i < services.length; ++i)
			{
				var service = services[i];
				service.uuid = exports.getCanonicalUUID(service.uuid);
				if (includeService(service))
				{
					// Save service.
					serviceArray.push(service);
					service.characteristics = [];

					// Read characteristics for service.
					exports.characteristics(
						deviceOrHandle,
						service,
						characteristicsCallbackFun(service),
						function(errorCode)
						{
							fail(errorCode);
						});
				}
				else
				{
					// Service not included, but reduce readCounter.
					--readCounter;
				}
			}
		};
	}

	function characteristicsCallbackFun(service)
	{
		return function(characteristics)
		{
			--readCounter;
			readCounter += characteristics.length;
			for (var i = 0; i < characteristics.length; ++i)
			{
				var characteristic = characteristics[i];
				characteristic.uuid = exports.getCanonicalUUID(characteristic.uuid);
				service.characteristics.push(characteristic);
				characteristic.descriptors = [];

				// Read descriptors for characteristic.
				exports.descriptors(
					deviceOrHandle,
					characteristic,
					descriptorsCallbackFun(characteristic),
					function(errorCode)
					{
						console.log('descriptors error: ' + errorCode);
						fail(errorCode);
					});
			}
		};
	}

	function descriptorsCallbackFun(characteristic)
	{
		return function(descriptors)
		{
			--readCounter;
			for (var i = 0; i < descriptors.length; ++i)
			{
				var descriptor = descriptors[i];
				descriptor.uuid = exports.getCanonicalUUID(descriptor.uuid);
				characteristic.descriptors.push(descriptor);
			}
			if (0 == readCounter)
			{
				// Everything is read. If a device object is supplied,
				// set the services array of the device to the result.
				if (typeof deviceOrHandle == 'object')
				{
					deviceOrHandle.services = serviceArray;
				}

				// Call result function.
				success(serviceArray);
			}
		};
	}

	// Read services for device.
	exports.services(
		deviceOrHandle,
		servicesCallbackFun(),
		function(errorCode)
		{
			console.log('services error: ' + errorCode);
			fail(errorCode);
		});
};

/**
 * Get a service object from a device or array.
 * @param {DeviceInfo} device - Device object (or array of {@link Service} objects).
 * @param {string} uuid - UUID of service to get.
 */
exports.getService = function(deviceOrServices, uuid)
{
	var services = null;

	if (Array.isArray(deviceOrServices))
	{
		// First arg is a service array.
		services = deviceOrServices;
	}
	else if (deviceOrServices && Array.isArray(deviceOrServices.services))
	{
		// First arg is a device object.
		services = deviceOrServices.services;
	}
	else
	{
		// First arg is invalid.
		return null;
	}

	// Normalize UUID.
	uuid = exports.getCanonicalUUID(uuid);

	for (var i in services)
	{
		var service = services[i];
		if (service.uuid == uuid)
		{
			return service;
		}
	}

	return null;
};

/**
 * Get a characteristic object of a service. (Characteristics
 * within a service that share the same UUID (rare case) must
 * be retrieved by manually traversing the characteristics
 * array of the service. This function will return the first
 * characteristic found, which may not be the one you want.
 * Note that this is a rare case.)
 * @param {Service} device - Service object.
 * @param {string} uuid - UUID of characteristic to get.
 */
exports.getCharacteristic = function(service, uuid)
{
	uuid = exports.getCanonicalUUID(uuid);

	var characteristics = service.characteristics;
	for (var i in characteristics)
	{
		var characteristic = characteristics[i];
		if (characteristic.uuid == uuid)
		{
			return characteristic;
		}
	}

	return null;
};

/**
 * Get a descriptor object of a characteristic.
 * @param {Characteristic} characteristic - Characteristic object.
 * @param {string} uuid - UUID of descriptor to get.
 */
exports.getDescriptor = function(characteristic, uuid)
{
	uuid = exports.getCanonicalUUID(uuid);

	var descriptors = characteristic.descriptors;
	for (var i in descriptors)
	{
		var descriptor = descriptors[i];
		if (descriptor.uuid == uuid)
		{
			return descriptor;
		}
	}

	return null;
};


/********** Platform utilities **********/

exports.os = (window.evothings && window.evothings.os) ? window.evothings.os : {}

/**
 * Returns true if current platform is iOS, false if not.
 * @return {boolean} true if platform is iOS, false if not.
 * @public
 */
exports.os.isIOS = function()
{
	return /iP(hone|ad|od)/.test(navigator.userAgent);
};

/**
 * Returns true if current platform is Android, false if not.
 * @return {boolean} true if platform is Android, false if not.
 * @public
 */
exports.os.isAndroid = function()
{
	return /Android|android/.test(navigator.userAgent);
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

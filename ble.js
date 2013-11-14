
var exec = cordova.require('cordova/exec');

/** Starts scanning for devices.
* Found devices and errors will be reported to the supplied callbacks.
* Will keep scanning indefinitely until you call stopScan().
* To conserve energy, call stopScan() as soon as you've found the device you're looking for.
* Calling this function while scanning is in progress has no effect?
*
* win(address, rssi, name, scanRecord)
* address is a string on the form xx:xx:xx:xx:xx:xx, where x are hexadecimal characters.
* rssi is an integer.
* name is a string or nil.
* scanRecord is a string of bytes.
*
* fail(errorCode)
*
* todo: define errorCodes.
* maybe: add scanRecord.
*/
exports.startScan = function(win, fail) {
	exec(win, fail, 'BLE', 'startScan', []);
};

/** Stops scanning for devices.
*/
exports.stopScan = function() {
	exec(null, null, 'BLE', 'stopScan', []);
};

/** Connect to a remote device.
* address: from startScan().
*
* win(device, state)
* Will be called whenever the device's connection state changes.
*
* fail(errorCode)
*/
exports.connect = function(address, win, fail) {
	exec(win, fail, 'BLE', 'connect', [address]);
};

exports.connectionState = {
	0: 'STATE_DISCONNECTED',
	1: 'STATE_CONNECTING',
	2: 'STATE_CONNECTED',
	3: 'STATE_DISCONNECTING',
};

/** Close the connection to a remote device.
* Frees any native resources.
* Causes callbacks to the function passed to connect().
*/
exports.close = function(device) {
	exec(null, null, 'BLE', 'close', [device]);
};

/** Fetch the remote device's RSSI (signal strength).
*
* win(rssi)
* fail(errorCode)
*/
exports.rssi = function(device, win, fail) {
	exec(win, fail, 'BLE', 'rssi', [device]);
};

// returns handles that ought to remain valid over the program's lifetime.
/** Fetch a device's services and iterate through them.
*
* win(service)
* service is a json object that also serves as a handle to the service in other functions.
* contents: int handle, string uuid, int type, int characteristicCount, int serviceCount.
* uuid is a string formatted according to RFC 4122.
* serviceCount is the number of callbacks you'll get.
*/
exports.services = function(device, win, fail) {
	exec(win, fail, 'BLE', 'services', [device]);
};

exports.serviceType = {
	0: 'SERVICE_TYPE_PRIMARY',
	1: 'SERVICE_TYPE_SECONDARY',
};

/** Iterate through a service's characteristics.
* This function cannot fail.
*
* win(characteristic)
* int handle, string uuid, int permissions, int properties, int writeType, int descriptorCount.
*/
exports.characteristics = function(device, serviceHandle, win) {
	exec(win, null, 'BLE', 'characteristics', [device, serviceHandle]);
};

exports.permission = {
	1: 'PERMISSION_READ',
	2: 'PERMISSION_READ_ENCRYPTED',
	4: 'PERMISSION_READ_ENCRYPTED_MITM',
	16: 'PERMISSION_WRITE',
	32: 'PERMISSION_WRITE_ENCRYPTED',
	64: 'PERMISSION_WRITE_ENCRYPTED_MITM',
	128: 'PERMISSION_WRITE_SIGNED',
	256: 'PERMISSION_WRITE_SIGNED_MITM',
};

exports.property = {
	1: 'PROPERTY_BROADCAST',
	2: 'PROPERTY_READ',
	4: 'PROPERTY_WRITE_NO_RESPONSE',
	8: 'PROPERTY_WRITE',
	16: 'PROPERTY_NOTIFY',
	32: 'PROPERTY_INDICATE',
	64: 'PROPERTY_SIGNED_WRITE',
	128: 'PROPERTY_EXTENDED_PROPS',
};

exports.writeType = {
	1: 'WRITE_TYPE_NO_RESPONSE',
	2: 'WRITE_TYPE_DEFAULT',
	4: 'WRITE_TYPE_SIGNED',
};

/** Iterate through a characteristic's descriptors.
* This function cannot fail.
*
* win(descriptor)
* int handle, string uuid, int permissions.
*/
exports.descriptors = function(device, characteristicHandle, win) {
	exec(win, null, 'BLE', 'descriptors', [device, characteristicHandle]);
};


// read*: fetch and return value in one op.
// values should be cached on the JS side, if at all.
// data is an ArrayBuffer.

/** Reads a characteristic's value from the remote device.
*
* win(data)
* fail(errorCode)
*/
exports.readCharacteristic = function(device, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'readCharacteristic', [device, characteristicHandle]);
};

/** Reads a descriptor's value from the remote device.
*
* win(data)
* fail(errorCode)
*/
exports.readDescriptor = function(device, descriptorHandle, win, fail) {
	exec(win, fail, 'BLE', 'readDescriptor', [device, descriptorHandle]);
};

/** Write a characteristic's value to the remote device.
*
* win()
* fail(errorCode)
*/
exports.writeCharacteristic = function(device, characteristicHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeCharacteristic', [device, characteristicHandle, data]);
};

/** Write a descriptor's value to the remote device.
*
* win()
* fail(errorCode)
*/
exports.writeDescriptor = function(device, descriptorHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeDescriptor', [device, descriptorHandle, data]);
};

/** Request notification on changes to a characteristic's value.
* This is more efficient than polling the value using readCharacteristic().
*
* To make them send notifications,
* some (all?) devices require you to write a special value to a separate configuration characteristic,
* in addition to calling this function.
* Refer to your device's documentation.
*
* win(data)	-- called every time the value changes.
* fail(errorCode)
*/
exports.enableNotification = function(device, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'enableNotification', [device, characteristicHandle]);
};

/** Disable notification of changes to a characteristic's value.
*
* win()
* fail(errorCode)
*/
exports.disableNotification = function(device, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'disableNotification', [device, characteristicHandle]);
};

/** i is an integer. It is converted to byte and put in an array[1].
* The array is returned.
* assert(string.charCodeAt(0) == i).
*
* win(string)
*/
exports.testCharConversion = function(i, win) {
	exec(win, null, 'BLE', 'testCharConversion', [i]);
};

/** Resets the device's Bluetooth system.
* This is useful on some buggy devices where BLE functions stops responding until reset.
* Read: Android 4.3.
* This function takes 3-5 seconds.
*
* win()
* fail(errorCode)
*/
exports.reset = function(win, fail) {
	exec(win, fail, 'BLE', 'reset', []);
};

exports.fromUtf8 = function(arrayBuf) {
	return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(arrayBuf))));
};
exports.toUtf8 = function(s) {
	return new Uint8Array(unescape(encodeURIComponent(s)));
};

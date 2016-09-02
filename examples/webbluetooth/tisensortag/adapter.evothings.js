/* @license
 *
 * BLE Abstraction Tool: Evothings BLE plugin adapter
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Rob Moran
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// https://github.com/umdjs/umd
;(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		// Not supported by Cordova.
		define(['bleat', 'bluetooth.helpers'], factory.bind(this, root));
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS
		// Not supported by Cordova.
		module.exports = function(bleat) {
			return factory(root, bleat, require('./bluetooth.helpers'));
		};
	} else {
		// Browser globals with support for web workers (root is window)
		// Used with Cordova.
		factory(root, root.bleat, root.bleatHelpers);
	}
})(this, function(root, bleat, helpers) {
	"use strict";

	// Object that holds Bleat adapter functions.
	var adapter = {};

	var mDeviceIdToDeviceHandle = {};
	var mServiceHandleToDeviceHandle = {};
	var mCharacteristicHandleToDeviceHandle = {};
	var mDescriptorHandleToDeviceHandle = {};
	var mCharacteristicHandleToCCCDHandle = {};

	// Add adapter object to Bleat. Adapter functions are defined below.
	bleat._addAdapter('evothings', adapter);

	function init(readyFn) {
		if (root.evothings && evothings.ble) readyFn();
		else document.addEventListener("deviceready", readyFn);
	}

	// Begin scanning for devices
	adapter.startScan = function(
		serviceUUIDs,	// String[] serviceUUIDs		advertised service UUIDs to restrict results by
		foundFn,		// Function(Object deviceInfo)	function called with each discovered deviceInfo
		completeFn,		// Function()					function called once starting scanning
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		init(function() {
			evothings.ble.stopScan();
			evothings.ble.startScan(
			    serviceUUIDs,
				function(deviceInfo) {
					if (foundFn) { foundFn(createBleatDeviceObject(deviceInfo)); }
				},
				function(error) {
					if (errorFn) { errorFn(error); }
				});
			if (completeFn) { completeFn(); }
		});
	};

	// Stop scanning for devices
	adapter.stopScan = function(
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		init(function() {
			evothings.ble.stopScan();
		});
	};

	// Connect to a device
	adapter.connect = function(
		handle,			// String handle				device handle
		connectFn,		// Function()					function called when device connected
		disconnectFn,	// Function()					function called when device disconnected
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		// Check that device is not already connected.
		var deviceHandle = mDeviceIdToDeviceHandle[handle];
		if (deviceHandle) {
			if (errorFn) { errorFn('device already connected'); }
			return;
		}
		// Connect to the device.
		evothings.ble.connect(
			handle,
			// Connect success.
			function(connectInfo) {
				// Connected.
				if (2 === connectInfo.state && connectFn) {
					mDeviceIdToDeviceHandle[handle] = connectInfo.deviceHandle;
					connectFn();
				}
				// Disconnected.
				else if (0 === connectInfo.state && disconnectFn) {
					disconnectDevice(handle);
					disconnectFn();
				}
			},
			// Connect error.
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Disconnect from a device
	adapter.disconnect = function(
		handle,			// String handle				device handle
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		disconnectDevice(handle);
	};

	// Discover services on a device
	adapter.discoverServices = function(
		handle,			// String handle					device handle
		serviceUUIDs,	// String[] serviceUUIDs			service UUIDs to restrict results by
		completeFn,		// Function(Object[] serviceInfo)	function called when discovery completed
		errorFn			// Function(String errorMsg)		function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromDeviceId(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.services(
			deviceHandle,
			function(services) {

				// Collect found services.
				var discoveredServices = [];

				services.forEach(function(serviceInfo) {
					var serviceUUID = helpers.getCanonicalUUID(serviceInfo.uuid);

					// Filter services.
					var includeService =
						!serviceUUIDs ||
						0 === serviceUUIDs.length ||
						serviceUUIDs.indexOf(serviceUUID) >= 0;

					if (includeService) {
						// Set device for service.
						mServiceHandleToDeviceHandle[serviceInfo.handle] = deviceHandle;

						// Add the service.
						discoveredServices.push(
							{
								_handle: serviceInfo.handle,
								uuid: serviceUUID,
								primary: true
							});
					}
				});

				// Return result.
				if (completeFn) {
					completeFn(discoveredServices);
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Discover included services on a service
	adapter.discoverIncludedServices = function(
		handle,			// String handle					service handle
		serviceUUIDs,	// String[] serviceUUIDs			service UUIDs to restrict results by
		completeFn,		// Function(Object[] serviceInfo)	function called when discovery completed
		errorFn			// Function(String errorMsg)		function called if error occurs
		)
	{
		// Not implemented in the BLE plugin.
		completeFn([]);
	};

	// Discover characteristics on a service
	adapter.discoverCharacteristics = function(
		handle,					// String handle							service handle
		characteristicUUIDs,	// String[] characteristicUUIDs				characteristic UUIDs to restrict results by
		completeFn,				// Function(Object[] characteristicInfo)	function called when discovery completed
		errorFn					// Function(String errorMsg)				function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromServiceHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.characteristics(
			deviceHandle,
			handle,
			function(characteristics) {

				// Collect found characteristics.
				var discoveredCharacteristics = [];

				characteristics.forEach(function(characteristicInfo) {
					var characteristicUUID =
						helpers.getCanonicalUUID(characteristicInfo.uuid);

					// Filter characteristics.
					var includeCharacteristic =
						!characteristicUUIDs ||
						0 === characteristicUUIDs.length ||
						characteristicUUIDs.indexOf(characteristicUUID) >= 0;

					if (includeCharacteristic) {
						// Set device for characteristic.
						mCharacteristicHandleToDeviceHandle[
							characteristicInfo.handle] = deviceHandle;

						// Add the characteristic.
						// For the characteristic property constants, see:
						//	 https://github.com/evothings/cordova-ble/blob/master/ble.js#L256
						// Goes without saying they should have symbolic names!!
						// Created issue: https://github.com/evothings/cordova-ble/issues/90
						discoveredCharacteristics.push(
							{
								_handle: characteristicInfo.handle,
								uuid: characteristicUUID,
								properties: {
									broadcast:
										characteristicInfo.property & 1,
									read:
										characteristicInfo.property & 2,
									writeWithoutResponse:
										(characteristicInfo.property & 4) && // AND or OR?
										(characteristicInfo.writeType & 1),
									write:
										characteristicInfo.property & 8,
									notify:
										characteristicInfo.property & 16,
									indicate:
										characteristicInfo.property & 32,
									authenticatedSignedWrites:
										(characteristicInfo.property & 64) && // AND or OR?
										(characteristicInfo.writeType & 4),
									reliableWrite:
										false,
									writableAuxiliaries:
										false
								}
							});
					}
				});

				// Return result.
				if (completeFn) {
					completeFn(discoveredCharacteristics);
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Discover descriptors on a characteristic
	adapter.discoverDescriptors = function(
		handle,				// String handle						characteristic handle
		descriptorUUIDs,	// String[] descriptorUUIDs				descriptor UUIDs to restrict results by
		completeFn,			// Function(Object[] descriptorInfo)	function called when discovery completed
		errorFn				// Function(String errorMsg)			function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromCharacteristicHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.descriptors(
			deviceHandle,
			handle,
			function(descriptors) {

				// Collect found descriptors.
				var discoveredDescriptors = [];

				descriptors.forEach(function(descriptorInfo) {
					var descriptorUUID = helpers.getCanonicalUUID(descriptorInfo.uuid);

					// If this is the CCCD we save it for use in enableNotify.
					if (descriptorUUID === '00002902-0000-1000-8000-00805f9b34fb') {
						mCharacteristicHandleToCCCDHandle[handle] = descriptorInfo.handle;
					}

					// Filter descriptors.
					var includeDescriptor =
						!descriptorUUIDs ||
						0 === descriptorUUIDs.length ||
						descriptorUUIDs.indexOf(descriptorUUID) >= 0;

					if (includeDescriptor) {
						// Set device for descriptor.
						mDescriptorHandleToDeviceHandle[descriptorInfo.handle] = deviceHandle;

						// Add the descriptor.
						discoveredDescriptors.push(
							{
								_handle: descriptorInfo.handle,
								uuid: descriptorUUID
							});
					}
				});

				// Return result.
				if (completeFn) {
					completeFn(discoveredDescriptors);
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Read a characteristic value
	adapter.readCharacteristic = function(
		handle,			// String handle				characteristic handle
		completeFn,		// Function(DataView value)		function called when read completes
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromCharacteristicHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		// TODO: Re-enable notification on iOS if there was one, see issue:
		// https://github.com/evothings/cordova-ble/issues/61
		// Currently we do not work around this limitation.

		evothings.ble.readCharacteristic(
			deviceHandle,
			handle,
			function(data) {
				if (completeFn) {
					completeFn(bufferToDataView(data));
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Write a characteristic value
	adapter.writeCharacteristic = function(
		handle,			// String handle				characteristic handle
		value,			// DataView value				value to write
		completeFn,		// Function()					function called when write completes
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromCharacteristicHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.writeCharacteristic(
			deviceHandle,
			handle,
			value,
			function() {
				if (completeFn) {
					completeFn();
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Enable value change notifications on a characteristic
	adapter.enableNotify = function(
		handle,			// String handle				characteristic handle
		notifyFn,		// Function(DataView value)		function called when value changes
		completeFn,		// Function()					function called when notifications enabled
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromCharacteristicHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		// TODO: Android needs the CCCD written to for notifications
		// Should be encapsulated in native android layer, see issue:
		// https://github.com/evothings/cordova-ble/issues/30

		// Write the CCCD regardless of platform, makes no harm on iOS.
		writeCCCD(
			deviceHandle,
			handle,
			enableNotification,
			function(error) {
				if (errorFn) { errorFn(error); }
			});

		function enableNotification()
		{
			evothings.ble.enableNotification(
				deviceHandle,
				handle,
				function(data) {
					if (notifyFn) {
						notifyFn(bufferToDataView(data));
					}
				},
				function(error) {
					if (errorFn) { errorFn(error); }
				});

			// Notifications "should have" been enabled.
			if (completeFn) {
				completeFn();
			}
		}
	};

	// Disable value change notifications on a characteristic
	adapter.disableNotify = function(
		handle,			// String handle				characteristic handle
		completeFn,		// Function()					function called when notifications disabled
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromCharacteristicHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.disableNotification(
			deviceHandle,
			handle,
			function() {
				if (completeFn) {
					completeFn();
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});

		// TODO: iOS doesn't call back after disable, see issue:
		// https://github.com/evothings/cordova-ble/issues/65
		// Hack to compensate.
		if (platformIsIOS()) {
			setTimeout(completeFn, 0); // Timeout perhaps not needed.
		}
	};

	// Read a descriptor value
	adapter.readDescriptor = function(
		handle,			// String handle				descriptor handle
		completeFn,		// Function(DataView value)		function called when read completes
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromDescriptorHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.readDescriptor(
			deviceHandle,
			handle,
			function(data) {
				if (completeFn) {
					completeFn(bufferToDataView(data));
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	// Write a descriptor value
	adapter.writeDescriptor = function(
		handle,			// String handle				descriptor handle
		value,			// DataView value				value to write
		completeFn,		// Function()					function called when write completes
		errorFn			// Function(String errorMsg)	function called if error occurs
		)
	{
		var deviceHandle = getDeviceHandleFromDescriptorHandle(handle, errorFn);
		if (!deviceHandle) {
			return;
		}

		evothings.ble.writeDescriptor(
			deviceHandle,
			handle,
			value,
			function() {
				if (completeFn) {
					completeFn();
				}
			},
			function(error) {
				if (errorFn) { errorFn(error); }
			});
	};

	function disconnectDevice(handle)
	{
		var deviceHandle = mDeviceIdToDeviceHandle[handle];
		if (deviceHandle) {
			// Disconnect the device.
			evothings.ble.close(deviceHandle);
			// Delete device handle mapping.
			delete mDeviceIdToDeviceHandle[handle];
			// Delete related mappings for service handles etc.
			deleteDeviceHandleMappings(deviceHandle, mServiceHandleToDeviceHandle);
			deleteDeviceHandleMappings(deviceHandle, mCharacteristicHandleToDeviceHandle, true);
			deleteDeviceHandleMappings(deviceHandle, mDescriptorHandleToDeviceHandle);
		}
	}

	function deleteDeviceHandleMappings(deviceHandle, map, isCharateristicsMap)
	{
		for (var key in map) {
			if (deviceHandle === map[key]) {

				// Delete the mapping.
				delete map[key];

				// If mapping for this key exists (yes it is a hack to do this here).
				if (isCharateristicsMap && mCharacteristicHandleToCCCDHandle[key]) {
					delete mCharacteristicHandleToCCCDHandle[key];
				}
			}
		}
	}

	function getDeviceHandleFromDeviceId(handle, errorFn)
	{
		var deviceHandle = mDeviceIdToDeviceHandle[handle];
		if (!deviceHandle) {
			if (errorFn) { errorFn('Device does not exist for device id: ' + handle); }
			return null;
		}
		return deviceHandle;
	}

	function getDeviceHandleFromServiceHandle(handle, errorFn)
	{
		var deviceHandle = mServiceHandleToDeviceHandle[handle];
		if (!deviceHandle) {
			if (errorFn) { errorFn('Device does not exist for service handle: ' + handle); }
			return null;
		}
		return deviceHandle;
	}

	function getDeviceHandleFromCharacteristicHandle(handle, errorFn)
	{
		var deviceHandle = mCharacteristicHandleToDeviceHandle[handle];
		if (!deviceHandle) {
			if (errorFn) { errorFn('Device does not exist for characteristic handle: ' + handle); }
			return null;
		}
		return deviceHandle;
	}

	function writeCCCD(deviceHandle, characteristicHandle, successCallback, errorCallback)
	{
		// Do we have a saved descriptor handle from descriptor discovery?
		var cccdHandle = mCharacteristicHandleToCCCDHandle[characteristicHandle];
		if (cccdHandle) {
			writeTheCCCD(cccdHandle);
		}
		else {
			discoverTheCCCD();
		}

		function writeTheCCCD(cccdHandle)
		{
			evothings.ble.writeDescriptor(
				deviceHandle,
				cccdHandle,
				new Uint8Array([1,0]),
				function() {
					successCallback();
				},
				function(error) {
					errorCallback(error);
				});
		}

		function discoverTheCCCD()
		{
			adapter.discoverDescriptors(
				characteristicHandle,
				'00002902-0000-1000-8000-00805f9b34fb', // CCCD UUID
				function(descriptors) {
					var cccdHandle = mCharacteristicHandleToCCCDHandle[characteristicHandle];
					if (cccdHandle) {
						writeTheCCCD(cccdHandle);
					}
					else {
						errorCallback('Could not find CCCD for characteristic: ' + characteristicHandle);
					}
				},
				function(error) {
					errorCallback(error);
					return;
				});
		}
	}

	/**
	 * Create a Bleat deviceInfo object based on the device info from the BLE plugin.
	 * @param deviceInfo BLE plugin deviceInfo object (source).
	 * @return Bleat deviceInfo object.
	 */
	function createBleatDeviceObject(deviceInfo)
	{
		// Bleat device object.
		var device = {};

		// Device handle and id.
		device._handle = deviceInfo.address;
		device.id = deviceInfo.address;

		// Use the advertised name as default. Use name in
		// advertisement data if available (see below).
		device.name = deviceInfo.name;

		// Array or service UUIDs (populated below).
		device.uuids = [];

		// Object that holds advertisement data.
		device.adData = {};

		// RSSI value.
		device.adData.rssi = deviceInfo.rssi;

		// txPower not available.
		device.adData.txPower = null;

		// Service data (set below).
		device.adData.serviceData = {};

		// Manufacturer data (set below).
		device.adData.manufacturerData = null;

		if (deviceInfo.advertisementData) {
			parseiOSAdvertisementData(deviceInfo, device);
		}
		else if (deviceInfo.scanRecord) {
			parseScanRecordAdvertisementData(deviceInfo, device);
		}

		return device;
	}

	/**
	 * @param deviceInfo BLE plugin deviceInfo object (source).
	 * @param device Bleat deviceInfo object (destination).
	 */
	function parseiOSAdvertisementData(deviceInfo, device)
	{
		// On iOS advertisement data is available in predefined fields.
		if (deviceInfo.advertisementData) {

			// Device name.
			if (deviceInfo.advertisementData.kCBAdvDataLocalName) {
				device.name = deviceInfo.advertisementData.kCBAdvDataLocalName;
			}

			// txPower.
			if (deviceInfo.advertisementData.kCBAdvDataTxPowerLevel) {
				device.adData.txPower = deviceInfo.advertisementData.kCBAdvDataTxPowerLevel;
			}

			// Service UUIDs.
			if (deviceInfo.advertisementData.kCBAdvDataServiceUUIDs) {
				deviceInfo.advertisementData.kCBAdvDataServiceUUIDs.forEach(function(serviceUUID) {
					device.uuids.push(helpers.getCanonicalUUID(serviceUUID));
				});
			}

			// Service data.
			if (deviceInfo.advertisementData.kCBAdvDataServiceData) {
				for (var uuid in deviceInfo.advertisementData.kCBAdvDataServiceData) {
					var data = deviceInfo.advertisementData.kCBAdvDataServiceData[uuid];
					device.adData.serviceData[helpers.getCanonicalUUID(uuid)] = bufferToDataView(base64DecToArr(data));
				}
			}

			// Manufacturer data.
			// TODO: Create map with company identifier (see Noble adapter).
			if (deviceInfo.advertisementData.kCBAdvDataManufacturerData) {
				// Save raw data as well.
				device.adData.manufacturerDataRaw = deviceInfo.advertisementData.kCBAdvDataManufacturerData;
			}
		}
	}

	/**
	 * Decode the scan record. Data is encoded using a length byte followed by data.
	 * @param deviceInfo BLE plugin deviceInfo object (source).
	 * @param device Bleat deviceInfo object (destination).
	 */
	function parseScanRecordAdvertisementData(deviceInfo, device)
	{
		var byteArray = base64DecToArr(deviceInfo.scanRecord);
		var pos = 0;
		while (pos < byteArray.length) {

			var length = byteArray[pos++];
			if (length === 0) break;
			length -= 1;
			var type = byteArray[pos++];
			var i;

			// Local Name.
			if (type === 0x08 || type === 0x09) {
				// Convert UTF8 encoded buffer and strip null characters from the resulting string.
				device.name = evothings.ble.fromUtf8(
					new Uint8Array(byteArray.buffer, pos, length)).replace('\0', '');
			}
			// TX Power Level.
			else if (type === 0x0a) {
				device.adData.txPower = littleEndianToInt8(byteArray, pos);
			}
			// 16-bit Service Class UUID.
			else if (type === 0x02 || type === 0x03) {
				for (i = 0; i < length; i += 2) {
					device.uuids.push(
						helpers.getCanonicalUUID(
							littleEndianToUint16(byteArray, pos + i).toString(16)));
				}
			}
			// 32-bit Service Class UUID.
			else if (type === 0x04 || type === 0x05) {
				for (i = 0; i < length; i += 4) {
					device.uuids.push(
						helpers.getCanonicalUUID(
							littleEndianToUint32(byteArray, pos + i).toString(16)));
				}
			}
			// 128-bit Service Class UUID.
			else if (type === 0x06 || type === 0x07) {
				for (i = 0; i < length; i += 16) {
					device.uuids.push(
						helpers.getCanonicalUUID(arrayToUUID(byteArray, pos + i)));
				}
			}

			pos += length;
		}
	}
/*
	Not used.
	function stringToArrayBuffer(string) {
		var buffer = new ArrayBuffer(string.length);
		var bufferView = new Uint8Array(buffer);
		for (var i = 0; i < string.length; ++i)
		{
			bufferView[i] = string.charCodeAt(i);
		}
		return buffer;
	}

	function arrayBufferToString(buffer) {
		return String.fromCharCode.apply(null, new Uint8Array(buffer));
	}
*/
	// Code from https://github.com/evothings/evothings-libraries/blob/master/libs/evothings/easyble/easyble.js
	// Should be encapsulated in the native Android implementation, see issue:
	// https://github.com/evothings/cordova-ble/issues/62

	function b64ToUint6(nChr)
	{
		return nChr > 64 && nChr < 91 ? nChr - 65
			: nChr > 96 && nChr < 123 ? nChr - 71
			: nChr > 47 && nChr < 58 ? nChr + 4
			: nChr === 43 ? 62
			: nChr === 47 ? 63
			: 0;
	}

	function base64DecToArr(sBase64, nBlocksSize)
	{
		var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
		var nInLen = sB64Enc.length;
		var nOutLen = nBlocksSize ?
			Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize :
			nInLen * 3 + 1 >> 2;
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
	 * Interpret byte buffer as little endian 8 bit integer.
	 * Returns converted number.
	 * @param {ArrayBuffer} data - Input buffer.
	 * @param {number} offset - Start of data.
	 * @return Converted number.
	 */
	function littleEndianToInt8(data, offset)
	{
		var x = data[offset];
		if (x & 0x80) x = x - 256;
		return x;
	}

	function littleEndianToUint16(data, offset)
	{
		return (data[offset + 1] << 8) + data[offset];
	}

	function littleEndianToUint32(data, offset)
	{
		return (data[offset + 3] << 24) + (data[offset + 2] << 16) + (data[offset + 1] << 8) + data[offset];
	}

	function arrayToUUID(array, offset)
	{
		var uuid = "";
		for (var i = 0; i < 16; i++) {
			uuid += ("00" + array[offset + i].toString(16)).slice(-2);
		}
		return uuid;
	}

	function bufferToDataView(buffer)
	{
		// Buffer to ArrayBuffer
		var arrayBuffer = new Uint8Array(buffer).buffer;
		return new DataView(arrayBuffer);
	}

	/*
	Not used.
	function dataViewToBuffer(dataView)
	{
		// DataView to TypedArray
		var typedArray = new Uint8Array(dataView.buffer);
		return new Buffer(typedArray);
	}*/

	function getPlatform()
	{
		if (root.cordova) {
			return root.cordova.platformId;
		}
		else {
			return null;
		}
	}

	function platformIsIOS()
	{
		return 'ios' === getPlatform();
	}

	function platformIsAndroid()
	{
		return 'android' === getPlatform();
	}
});

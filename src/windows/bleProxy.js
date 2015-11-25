// -----------------------------------------------------------------------------
// Copyright 2015 Next Wave Sottware, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	 http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// This is the Windows 8.1 implementation of the com.evothings.ble plugin API.
// All callable endpoints are in this BLE namespace.
// -----------------------------------------------------------------------------
cordova.commandProxy.add("BLE", {

	// exec(win, fail, 'BLE', 'startScan', []);
	startScan: function (successCallback, errorCallback) {
		winble.logger.logApiEntry("startScan");
		winble.deviceManager.startScan(successCallback, errorCallback);
		winble.logger.logApiExit("startScan");
	},

	// exec(null, null, 'BLE', 'stopScan', []);
	stopScan: function () {
		winble.logger.logApiEntry("stopScan");
		winble.deviceManager.stopScan();
		winble.logger.logApiExit("stopScan");
	},

	// exec(win, fail, 'BLE', 'connect', [deviceId]);
	connect: function (successCallback, errorCallback, deviceId) {
		winble.logger.logApiEntry("connect");
		winble.deviceManager.connectToDevice(successCallback, errorCallback, deviceId);
		winble.logger.logApiExit("connect");
	},

	// exec(null, null, 'BLE', 'close', [deviceHandle]);
	close: function (successCallback, errorCallback, deviceHandle) {
		winble.logger.logApiEntry("close");
		winble.deviceManager.closeDevice(successCallback, errorCallback, deviceHandle);
		winble.logger.logApiExit("close");
	},

	// exec(win, fail, 'BLE', 'rssi', [deviceHandle]);
	rssi: function (successCallback, errorCallback, deviceHandle) {
		winble.logger.logApiEntry("rssi");
		winble.deviceManager.getDeviceRssi(successCallback, errorCallback, deviceHandle);
		winble.logger.logApiExit("rssi");
	},

	// exec(win, fail, 'BLE', 'services', [deviceHandle]);
	services: function (successCallback, errorCallback, deviceHandle) {
		winble.logger.logApiEntry("services");
		winble.deviceManager.getDeviceServices(successCallback, errorCallback, deviceHandle);
		winble.logger.logApiExit("services");
	},

	// exec(win, fail, 'BLE', 'characteristics', [deviceHandle, serviceHandle]);
	characteristics: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("characteristics");
		var deviceHandle = args[0] ? args[0] : "";
		var serviceHandle = args[1] ? args[1] : "";
		winble.deviceManager.getServiceCharacteristics(successCallback, errorCallback, deviceHandle, serviceHandle);
		winble.logger.logApiExit("characteristics");
	},

	// exec(win, fail, 'BLE', 'descriptors', [deviceHandle, charHandle]);
	descriptors: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("descriptors");
		var deviceHandle = args[0] ? args[0] : "";
		var charHandle = args[1] ? args[1] : "";
		winble.deviceManager.getCharacteristicDescriptors(successCallback, errorCallback, deviceHandle, charHandle);
		winble.logger.logApiExit("descriptors");
	},

	// exec(win, fail, 'BLE', 'readCharacteristic', [deviceHandle, charHandle]);
	readCharacteristic: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("readCharacteristic");
		var deviceHandle = args[0] ? args[0] : "";
		var charHandle = args[1] ? args[1] : "";
		winble.deviceManager.readCharacteristic(successCallback, errorCallback, deviceHandle, charHandle);
		winble.logger.logApiExit("readCharacteristic");
	},

	// exec(win, fail, 'BLE', 'readDescriptor', [deviceHandle, descHandle]);
	readDescriptor: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("readDescriptor");
		var deviceHandle = args[0] ? args[0] : "";
		var descHandle = args[1] ? args[1] : "";
		winble.deviceManager.readDescriptor(successCallback, errorCallback, deviceHandle, descHandle);
		winble.logger.logApiExit("readDescriptor");
	},

	// exec(win, fail, 'BLE', 'writeCharacteristic', [deviceHandle, charHandle, data.buffer]);
	writeCharacteristic: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("writeCharacteristic");
		var deviceHandle = args[0] ? args[0] : "";
		var charHandle = args[1] ? args[1] : "";
		var dataBuffer = args[2] ? args[2] : "";
		winble.deviceManager.writeCharacteristic(successCallback, errorCallback, deviceHandle, charHandle, dataBuffer);
		winble.logger.logApiExit("writeCharacteristic");
	},

	// exec(win, fail, 'BLE', 'writeDescriptor', [deviceHandle, descHandle, data.buffer]);
	writeDescriptor: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("writeDescriptor");
		var deviceHandle = args[0] ? args[0] : "";
		var descHandle = args[1] ? args[1] : "";
		var dataBuffer = args[2] ? args[2] : "";
		winble.deviceManager.writeDescriptor(successCallback, errorCallback, deviceHandle, descHandle, dataBuffer);
		winble.logger.logApiExit("writeDescriptor");
	},

	// exec(win, fail, 'BLE', 'enableNotification', [deviceHandle, charHandle]);
	enableNotification: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("enableNotification");
		var deviceHandle = args[0] ? args[0] : "";
		var charHandle = args[1] ? args[1] : "";
		winble.deviceManager.enableCharacteristicNotification(successCallback, errorCallback, deviceHandle, charHandle);
		winble.logger.logApiExit("enableNotification");
	},

	// exec(win, fail, 'BLE', 'disableNotification', [deviceHandle, charHandle]);
	disableNotification: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("disableNotification");
		var deviceHandle = args[0] ? args[0] : "";
		var charHandle = args[1] ? args[1] : "";
		winble.deviceManager.disableCharacteristicNotification(successCallback, errorCallback, deviceHandle, charHandle);
		winble.logger.logApiExit("disableNotification");
	},

	// exec(win, null, 'BLE', 'testCharConversion', [i]);
	testCharConversion: function (successCallback, errorCallback, args) {
		winble.logger.logApiEntry("testCharConversion");
		var array = new Uint8Array(1);
		array[0] = args[0] ? args[0] : 0;
		successCallback(array);
		winble.logger.logApiExit("testCharConversion");
	},

	// exec(win, fail, 'BLE', 'reset', []);
	reset: function (successCallback, errorCallback) {
		winble.logger.logApiEntry("reset");
		winble.deviceManager.turnBluetoothOffAndOn(successCallback, errorCallback);
		winble.logger.logApiExit("reset");
	}
});

// -----------------------------------------------------------------------------
// This namespace contains the internal functions that are called by the API
// endpoints above to do the work.
// -----------------------------------------------------------------------------
var winble = {
	gatt: Windows.Devices.Bluetooth.GenericAttributeProfile,
	bleDevice: Windows.Devices.Bluetooth.BluetoothLEDevice,
	pnp: Windows.Devices.Enumeration.Pnp,
	nextGattHandle: 1,

	// -----------------------------------------------------------------------------
	// Functions for writing to the console. Set isDebugEnabled = true
	// to enable odometer-style tracing of all calls/processing that happen inside
	// of this plugin.
	// -----------------------------------------------------------------------------
	logger: {

		isDebugEnabled: false,

		baseLocation: "WINBLE bleProxy.",

		getTimeStamp: function () {
			var now = new Date();
			return (now.toLocaleDateString() + " " + now.toLocaleTimeString());
		},

		logApiEntry: function (functionName) {
			this.logDebug(functionName, "API entered");
		},

		logApiExit: function (functionName) {
			this.logDebug(functionName, "API exiting");
		},

		logDebug: function (location, msg) {
			if (winble.logger.isDebugEnabled)
				console.log(this.getTimeStamp() + " " + this.baseLocation + location + ": " + msg);
		},

		logError: function (location, msg) {
			console.log(this.getTimeStamp() + " " + this.baseLocation + location + ": " + msg);
		}
	},

	// -----------------------------------------------------------------------------
	// Functions for communicating with Bluetooth LE devices, called from the
	// API endpoints above.
	// -----------------------------------------------------------------------------
	deviceManager: {

		// Windows does not give us access to a device's RSSI, but the Evothings API expects it to be available.
		// So set a value here that is obviously not a real RSSI value so that the caller can take appropriate action
		// whenever we send them RSSI.
		DEFAULT_RSSI: 0,

		// When startScan() is called, scan for devices every SCAN_INTERVAL milliseconds
		SCAN_INTERVAL: 15000,   // 15000 ms = 15 seconds

		// When reporting the list of scanned devices, yield REPORT_INTERVAL milliseconds between each device
		REPORT_INTERVAL: 5000,  // 5000 ms = 5 seconds

		// When verifying a device on a timed basis & we find that it's not really out there, skip the next VERIFY_SKIP_COUNT tries.
		// If we continue to poke at it, Windows will disconnect the WiFi. Don't know why this is, but it is.
		VERIFY_SKIP_COUNT: 8,   // If SCAN_INTERVAL is 15 seconds, this is a duration of about 2min 15sec

		// API error code returned by our device lookup functions
		DEVICE_NOT_FOUND: "device not found",

		// API error code returned by our device connection functions
		DEVICE_NOT_CONNECTED: "disconnected",

		// This is a list of all BLE devices that have been paired with the Windows device, implemented as an object:
		//
		//  "gattDevice": A BluetoothLEDevice returned by Windows.Devices.Enumeration.DeviceInformation.findAllAsync
		//  "handle": Generated by us via winble.nextGattHandle++
		//  "containerId": "{" + deviceList[i].properties["System.Devices.ContainerId"] + "}",
		//  "serviceList" {}: A list of all services supported by this device, implemented as an object:
		//	  "gattService": A GattService from the BluetoothLEDevice.gattServices list
		//	  "handle": Generated by us via winble.nextGattHandle++
		//  "charList" {}: A list of all characteristics supported by this device, implemented as an object:
		//	  "gattChar": A GattCharacteristic returned by GattService.getAllCharacteristics()
		//	  "handle": Generated by us via winble.nextGattHandle++
		//  "descList": {} A list of all descriptors supported by this device, implemented as an object:
		//	  "gattDesc": A GattDescriptor returned by GattCharacteristic.getAllDescriptors()
		//	  "handle": Generated by us via winble.nextGattHandle++
		//  "isConnected": true/false, true if we're connected
		//  "rssi": Windows doesn't make this available to us, so we always report winble.deviceManager.DEFAULT_RSSI
		deviceList: {},

		// startScan() sets this when called
		isScanning: false,

		// These are the callbacks passed into the startScan API. We call them with { keepCallback: true } since we
		// call them repeatedly during scanning, so we need to keep them around for the life of the app.
		scanSuccessCallback: null,
		scanErrorCallback: null,

		// List of scanned device handles, we step through this array and report each device back to the caller:
		//  for (i = 0; i < reportList.length; i++)
		//	  report deviceList[reportList[i]];
		reportList: [],

		// startScan() sets this when it does the very first scan & starts reporting devices back to the caller. Reporting
		// then continues on a timed basis and startScan() will know that it has already kicked off the reporting process.
		isReporting: false,

		// When reporting scanned devices back to the caller, the handle of the next device to be reported (reportList[reportIndex])
		reportIndex: 0,

		// PNP object watcher that will notify us when a device's connection status changes
		connectionWatcher: null,

		// Called internally to look up a previously discovered BLE device by ID.
		// Once we discover a BLE device, we pass it back to the caller and give them the Device ID. For Windows
		// devices, it looks something like "\\?\BTHLEDevice#{00001800-0000-1000-8000-00805f9b34fb}....". When the caller
		// calls the connect API to connect to the device, this is the ID that they will pass to us to identify the device,
		// and once the connection is made, we will pass them back a handle to the device. Thereafter, they will refer to
		// the device using the handle vs. the ID. So here, look up the requested Device ID and complain if we can't find it.
		getDeviceFromId: function (deviceId, functionName, errorCallback) {
			for (var property in winble.deviceManager.deviceList) {
				if (winble.deviceManager.deviceList[property] && winble.deviceManager.deviceList[property].gattDevice.id == deviceId)
					return (winble.deviceManager.deviceList[property]);
			}

			if (functionName != "scanDevices") {
				var msg = "Could not find the requested device ID '" + deviceId + "'";
				winble.logger.logError(functionName, msg);
				errorCallback(winble.DEVICE_NOT_FOUND);
			}
			return (null);
		},

		// Called internally to look up a previously discovered BLE device by its Windows container ID.
		// Look up the requested device and complain if we can't find it.
		getDeviceFromContainerId: function (containerId) {
			for (var property in winble.deviceManager.deviceList) {
				if (winble.deviceManager.deviceList[property] && winble.deviceManager.deviceList[property].containerId == containerId)
					return (winble.deviceManager.deviceList[property]);
			}
			return (null);
		},

		// Called internally to look up a previously discovered BLE device by handle.
		// Look up the requested device and complain if we can't find it.
		getDeviceFromHandle: function (deviceHandle, functionName, errorCallback) {
			var device = winble.deviceManager.deviceList[deviceHandle];
			if (device == null) {
				var msg = "Could not find the requested device handle '" + deviceHandle + "'";
				winble.logger.logError(functionName, msg);
				errorCallback(winble.DEVICE_NOT_FOUND);
			}
			return (device);
		},

		// Called internally to look up a previously discovered service by handle.
		// Look up the requested service and complain if we can't find it.
		getServiceFromHandle: function (device, serviceHandle, functionName, errorCallback) {
			var service = device.serviceList[serviceHandle];
			if (service == null) {
				var msg = "Could not find the requested service handle '" + serviceHandle + "'";
				winble.logger.logError(functionName, msg);
				errorCallback(msg);
			}
			return (service);
		},

		// Called internally to look up a previously discovered characteristic by handle.
		// Look up the requested characteristic and complain if we can't find it.
		getCharacteristicFromHandle: function (device, charHandle, functionName, errorCallback) {
			var characteristic = device.charList[charHandle];
			if (characteristic == null) {
				var msg = "Could not find the requested characteristic handle '" + charHandle + "'";
				winble.logger.logError(functionName, msg);
				errorCallback(msg);
			}
			return (characteristic);
		},

		// Called from the startScan API; start scanning for available BLE devices
		startScan: function (successCallback, errorCallback) {
			if (!winble.deviceManager.isScanning) {
				winble.deviceManager.scanSuccessCallback = successCallback;
				winble.deviceManager.scanErrorCallback = errorCallback;
				winble.deviceManager.isScanning = true;
				setTimeout(function () {
					winble.deviceManager.scanDevices(successCallback, errorCallback);
				}, 500);
			}
		},

		// Called from the stopScan API; stop scanning for available BLE devices.
		stopScan: function () {
			if (winble.deviceManager.isScanning)
				winble.deviceManager.isScanning = false;
			if (winble.deviceManager.connectionWatcher !== null)
				winble.deviceManager.stopConnectionWatcher();
		},

		// This function is called on a timed basis to look for available BLE devices
		scanDevices: function (successCallback, errorCallback) {

			// If the caller told us to stop scanning since our last scan, nothing to do
			if (!winble.deviceManager.isScanning)
				return;

			// We want to be notified when any device's connection status changes
			if (winble.deviceManager.connectionWatcher === null) {
				winble.deviceManager.startConnectionWatcher();
			}

			// We'll be looking for devices that support the Generic Access service, which most devices should support.
			var serviceName = "Generic Access";
			var serviceId = winble.gatt.GattServiceUuids.genericAccess;

			// Enumerate devices. This call returns a list of all paired bluetooth devices rather than a list of devices that
			// we can actually see, so once we get each device we need to figure out of it's actually "there" by attempting
			// to connect to it.
			winble.logger.logDebug("scanDevices", "Starting scan...");
			Windows.Devices.Enumeration.DeviceInformation.findAllAsync(
				winble.gatt.GattDeviceService.getDeviceSelectorFromUuid(serviceId), ["System.Devices.ContainerId"]).done(
				function (deviceList) {
					winble.logger.logDebug("scanDevices", "Completed scan (success)");

					// See if we found any connected devices that support the Generic Access service
					if (deviceList.length == 0) {
						var msg = "Could not find any " + serviceName + " devices";
						winble.logger.logError("scanDevices", msg);
						errorCallback(msg, { keepCallback: true });
						return;
					}

					// Add newly discovered devices to our list
					var reachableCount = 0;
					for (var i = 0; i < deviceList.length; i++) {

						// Add it to our device list if it's not already there
						var device = winble.deviceManager.getDeviceFromId(deviceList[i].id, "scanDevices", errorCallback);
						if (device == null) {
							winble.logger.logDebug("scanDevices", "Found new " + serviceName + " device '" + deviceList[i].name + "'");
							device = {
								"gattDevice": deviceList[i],
								"handle": winble.nextGattHandle++,
								"containerId": "{" + deviceList[i].properties["System.Devices.ContainerId"] + "}",
								"serviceList": {},
								"charList": {},
								"descList": {},
								"isBeingVerified": false,
								"isReachable": false,
								"isConnected": false,
								"isDeleted": false,
								"verifySkipCounter": 0,
								"rssi": winble.deviceManager.DEFAULT_RSSI,
								connectSuccessCallback: null
							};
							winble.deviceManager.deviceList[device.handle] = device;
						}

						// Add it to our reporting list if it's not already there
						if (winble.deviceManager.reportList.indexOf(device.handle) == -1)
							winble.deviceManager.reportList.push(device.handle);

						// Use this to write the "Reporting x devices" debug message below
						if (device.isReachable)
							reachableCount++;

						// Verify that the device is actually out there and reachable
						if (!device.isBeingVerified)
							winble.deviceManager.verifyDevice(winble.deviceManager.deviceList[device.handle]);
					}

					winble.logger.logDebug("scanDevices", "Reporting " + reachableCount + " devices");

					// Remove from our reporting list any previously discovered devices that were no longer present in this scan
					winble.deviceManager.cleanReportList();

					// Set up the next scan
					setTimeout(function () {
						winble.deviceManager.scanDevices(successCallback, errorCallback);
					}, winble.deviceManager.SCAN_INTERVAL);

					// Start reporting our devices back to the caller if we haven't already done so on a previous scan
					if (!winble.deviceManager.isReporting) {
						winble.deviceManager.isReporting = true;
						setTimeout(function () {
							winble.deviceManager.reportNextDevice(successCallback);
						}, 500);
					}
				},

				function (error) {
					winble.logger.logDebug("scanDevices", "Completed scan (error)");
					var msg = "Windows.Devices.Enumeration.DeviceInformation.findAllAsync failed: " + error;
					winble.logger.logError("scanDevices", msg);
					errorCallback(msg, { keepCallback: true });
				});
		},

		// We are enumerating paired bluetooth devices and Windows has just reported this device. Verify that it's really
		// out there and reachable by attempting to connect to it.
		verifyDevice: function (device) {

			/*
			winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Faking isVerified");
			device.isReachable = true;
			device.isConnected = true;
			return;
			*/
			if (device.verifySkipCounter > 0) {
				if (device.verifySkipCounter++ <= winble.deviceManager.VERIFY_SKIP_COUNT) {
					winble.logger.logDebug("verifyDevice", "Skipping " + device.gattDevice.name + ", pass " + (device.verifySkipCounter - 1) + " of " + winble.deviceManager.VERIFY_SKIP_COUNT);
					return;
				}
				device.verifySkipCounter = 0;
			}

			device.isBeingVerified = true;

			// Connect to the device. I have never seen this call fail, whether the device is actually reachable or not; I think we're
			// just getting access to the device's entry in Windows bluetooth database here.
			winble.logger.logDebug("verifyDevice", "Attempting to connect to " + device.gattDevice.name);
			winble.gatt.GattDeviceService.fromIdAsync(device.gattDevice.id).done(
				function (service) {
					if (service) {

						// We successfully connected. Now get a list of all characteristics that this device supports
						// and try to read the first one in "uncached" mode (ie, directly from the device).
						winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Successfully connected, getting characteristics");
						var charList = service.getAllCharacteristics();
						winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Successfully got characteristics, " + charList.length + " items in list");
						if (typeof charList[0] !== "undefined") {
							var characteristic = charList[0];
							try {
								winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Reading first characteristic");
								characteristic.readValueAsync(Windows.Devices.Bluetooth.BluetoothCacheMode.uncached).done(
									function (currentValue) {
										if (currentValue.status === winble.gatt.GattCommunicationStatus.success) {
											// We were able to read the value directly from the device, it's really out there.
											winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Successfully read first characteristic");
											device.isReachable = true;
											device.isConnected = true;
										} else {
											// We couldn't read the value directly from the device, so we can't currently see it.
											winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Error reading first characteristic, access denied or unavailable");
											device.isReachable = false;
											device.isConnected = false;
											device.verifySkipCounter = 1;
										}
										device.isBeingVerified = false;
									},
									function (error) {
										winble.logger.logDebug("verifyDevice", device.gattDevice.name + ": Error reading first characteristic, " + error);
										device.isReachable = false;
										device.isConnected = false;
										device.verifySkipCounter = 1;
										device.isBeingVerified = false;
									});
							} catch (e) {
								winble.logger.logDebug("verifyDevice", "Error connecting to " + device.gattDevice.name + ", access denied or unavailable");
								device.isReachable = false;
								device.isConnected = false;
								device.isBeingVerified = false;
							}
						}
					} else {
						winble.logger.logDebug("verifyDevice", "Error connecting to " + device.gattDevice.name + ", access denied or unavailable");
						device.isReachable = false;
						device.isConnected = false;
						device.isBeingVerified = false;
					}
				},
				function (error) {
					winble.logger.logDebug("verifyDevice", "Error connecting to " + device.gattDevice.name + ": " + error);
					device.isReachable = false;
					device.isConnected = false;
					device.isBeingVerified = false;
				});
		},

		cleanReportList: function () {
			var handleList = [];
			var isDeviceMissing = false;
			for (var i = 0; i < winble.deviceManager.reportList.length; i++) {
				var device = winble.deviceManager.deviceList[winble.deviceManager.reportList[i]];
				if ((device === "undefined") || (device === null)) {
					isDeviceMissing = true;
				} else if (device.isDeleted || (device.isConnected && !device.isReachable)) {
					isDeviceMissing = true;
					device.isDeleted = false;
					device.isConnected = false;
					if (device.connectSuccessCallback != null) {
						var connectInfo = {
							"deviceHandle": device.handle,
							"state": 0 // 0 = Disconnected, 1 = Connecting, 2 = Connected, 3 = Disconnecting
						};
						device.connectSuccessCallback(connectInfo, { keepCallback: true });
					}
				} else {
					handleList.push(winble.deviceManager.reportList[i]);
				}
			}

			// If we removed devices from the list, replace the current list with the new list
			if (isDeviceMissing) {
				winble.deviceManager.reportList = handleList;
				winble.deviceManager.reportIndex = 0;
			}
		},

		// This function is called on a timed basis to report the next scanned device in our list to the caller
		reportNextDevice: function (successCallback) {

			// If the caller told us to stop scanning since our last scan, or all devices have been removed from the list, nothing to do
			if (!winble.deviceManager.isScanning || (winble.deviceManager.reportList.length == 0)) {
				winble.deviceManager.isReporting = false;
				return;
			}

			// Report the next device in our list
			var device = winble.deviceManager.getNextReportableDevice();
			if (device != null) {
				winble.logger.logDebug("reportNextDevice", "Reporting scan for " + device.gattDevice.name);
				var deviceOut = {
					"address": device.gattDevice.id,
					"name": device.gattDevice.name,
					"rssi": device.rssi,
					"scanRecord": "" // Base64 string, iOS only
				};
				successCallback(deviceOut, { keepCallback: true });
			}

			// Set up the next report
			setTimeout(function () {
				winble.deviceManager.reportNextDevice(successCallback);
			}, winble.deviceManager.REPORT_INTERVAL);
		},

		getNextReportableDevice: function () {

			// Get the next reportable device in our list. This would be a paired device that we
			// have confirmed is actually out there and accessible to us.
			var startindex = winble.deviceManager.reportIndex;
			while (true) {

				// Get the next device in the report list. If we are just starting up, the list may be empty.
				var device = winble.deviceManager.deviceList[winble.deviceManager.reportList[winble.deviceManager.reportIndex]];
				if (typeof device === "undefined")
					return (null);

				// Bump the index
				if (++winble.deviceManager.reportIndex >= winble.deviceManager.reportList.length)
					winble.deviceManager.reportIndex = 0;

				// Return this device if it's reportable
				if (device.isReachable)
					return (device);

				// Return null if we walked through the entire list and did not find a reportable device
				if (winble.deviceManager.reportIndex == startindex)
					return (null);
			}
		},

		// Called from the connect API; caller wants to connect to a previously discovered BLE device
		connectToDevice: function (successCallback, errorCallback, deviceId) {

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromId(deviceId, "connectToDevice", errorCallback);
			if (device == null) {
				errorCallback(winble.DEVICE_NOT_FOUND);
				return;
			}

			// Save the success callback; we will need to call this whenever the connection status changes.
			if (device.connectSuccessCallback == null)
				device.connectSuccessCallback = successCallback;

			// Call the success callback if the device is connected, error callback if not
			if (device.isReachable && device.isConnected) {
				winble.logger.logDebug("connectToDevice", "Connection successful");
				var connectInfo = {
					"deviceHandle": device.handle,
					"state": 2 // 0 = Disconnected, 1 = Connecting, 2 = Connected, 3 = Disconnecting
				};
				device.connectSuccessCallback(connectInfo, { keepCallback: true });
			} else {
				winble.logger.logDebug("connectToDevice", "Connection failed");
				errorCallback(winble.DEVICE_NOT_CONNECTED);
			}
		},

		// Tell Windows to notify us whenever the connection status of a BLE device changes. It appears that
		// IRL Windows only tells us when a device has been disconnected and not so much when newly connected.
		startConnectionWatcher: function () {
			winble.deviceManager.connectionWatcher = Windows.Devices.Enumeration.Pnp.PnpObject.createWatcher(
				Windows.Devices.Enumeration.Pnp.PnpObjectType.deviceContainer,
				["System.Devices.Connected"],
				"");
			winble.deviceManager.connectionWatcher.onupdated = winble.deviceManager.onDeviceConnectionUpdated;
			winble.deviceManager.connectionWatcher.start();
		},

		// Tell Windows to stop notifying us when BLE devices are connected/disconnected
		stopConnectionWatcher: function () {
			winble.deviceManager.connectionWatcher.stop();
			winble.deviceManager.connectionWatcher = null;
		},

		// A BLE device has just been connected or disconnected (though it seems that Windows does not currently call this
		// when a device is connected, only disconnected). Look up the device in our list and, if it's one of ours,
		// remove it from the reporting list so the client knows it's gone.
		onDeviceConnectionUpdated: function (e) {
			var device = winble.deviceManager.getDeviceFromContainerId(e.id);
			if (device != null) {
				var isConnected = e.properties["System.Devices.Connected"];
				winble.logger.logDebug("onDeviceConnectionUpdated", device.gattDevice.name + " isConnected=" + device.isConnected + ", new isConnected=" + isConnected);
				if (!isConnected) {
					device.isDeleted = true;
					winble.deviceManager.cleanReportList();
				}
			}
		},

		// Called from the close API
		closeDevice: function (successCallback, errorCallback, deviceHandle) {

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "closeDevice", errorCallback);
			if (device == null)
				return;

			// Remove the device from our list
			winble.deviceManager.deviceList[deviceHandle] = null;
		},

		// Called from the rssi API. Windows does not give us access to a device's RSSI, but the Evothings API expects
		// it to be available, so we will always return DEFAULT_RSSI here, which is a non-real-world RSSI value.
		getDeviceRssi: function (successCallback, errorCallback, deviceHandle) {

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "getDeviceRssi", errorCallback);
			if (device == null)
				return;

			// Return the RSSI value
			winble.logger.logDebug("getDeviceRssi", "Warning: Windows BLE does not currently provide RSSI");
			successCallback(device.rssi);
		},

		// Called from the services API; return a list of all BLE services supported by the specified device.
		getDeviceServices: function (successCallback, errorCallback, deviceHandle) {

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "getDeviceServices", errorCallback);
			if (device == null)
				return;

			// Enumerate the services
			winble.bleDevice.fromIdAsync(device.gattDevice.id).done(
				function (bleDevice) {
					winble.logger.logDebug("getDeviceServices", "BluetoothLEDevice.fromIdAsync completed with success");

					// Store the services and return an API-specified list to the caller
					var serviceListOut = [];
					for (var i = 0; i < bleDevice.gattServices.length; i++) {

						// Add service internally to the device so we can retrieve it later by its handle
						winble.logger.logDebug("getDeviceServices", "Found " + device.gattDevice.name + " service '" + bleDevice.gattServices[i].uuid + "'");
						var serviceStore = {
							"gattService": bleDevice.gattServices[i],
							"handle": winble.nextGattHandle++
						};
						device.serviceList[serviceStore.handle] = serviceStore;

						// Add service to return list
						var serviceOut = {
							"handle": serviceStore.handle,
							"uuid": serviceStore.gattService.uuid,
							"type": 0 // 0 = Primary, 1 = Secondary (Windows only returns primary services in the ble.gattServices list)
						};
						serviceListOut.push(serviceOut);
					}

					// Report the list of services back to the caller
					successCallback(serviceListOut);
				},
				function (error) {
					var msg = "BluetoothLEDevice.fromIdAsync('" + device.gattDevice.id + "') failed: " + error;
					winble.logger.logError("getDeviceServices", msg);
					errorCallback(msg);
				});
		},

		// Called from the characteristics API; return a list of all BLE characteristics associated with the specified device+service.
		getServiceCharacteristics: function (successCallback, errorCallback, deviceHandle, serviceHandle) {

			winble.logger.logDebug("getServiceCharacteristics", "deviceHandle='" + deviceHandle + ", serviceHandle='" + serviceHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "getServiceCharacteristics", errorCallback);
			if (device == null)
				return;

			// Find the requested service in the device's list of services
			var service = winble.deviceManager.getServiceFromHandle(device, serviceHandle, "getServiceCharacteristics", errorCallback);
			if (service == null)
				return;

			// Enumerate the characteristics on this service
			var charList = service.gattService.getAllCharacteristics();

			// Store the characteristics and return an API-specified list to the caller
			var charListOut = [];
			for (var i = 0; i < charList.length; i++) {

				// Add characteristic internally to the device so we can retrieve it later by its handle
				winble.logger.logDebug("getServiceCharacteristics", "Found " + service.gattService.uuid + " characteristic '" + charList[i].uuid + "'");
				var charStore = {
					"gattChar": charList[i],
					"handle": winble.nextGattHandle++
				};
				device.charList[charStore.handle] = charStore;

				// Add characteristic to return list
				var charOut = {
					"handle": charStore.handle,
					"uuid": charStore.gattChar.uuid,

					// TODO: Not at all sure if this is right as Microsoft has 1 of 4 values in this field and iOS/Android
					// TODO: have a bitfield, but see code in winble.deviceManager.permissionsFromProtectionLevel
					// TODO: as I try to map Microsoft's number to a bitfield.
					"permissions": winble.deviceManager.permissionsFromProtectionLevel(charStore.gattChar.protectionLevel),
					"properties": charStore.gattChar.characteristicProperties, // Microsoft's bitfield matches the BLE 4.2 spec
					"writeType": 3 // So (1+2), where 1: WRITE_TYPE_NO_RESPONSE, 2: WRITE_TYPE_DEFAULT, 4: WRITE_TYPE_SIGNED

				};
				charListOut.push(charOut);
			}

			// Report the list of characteristics back to the caller
			successCallback(charListOut);
		},

		// Called internally from getServiceCharacteristics() and getCharacteristicDescriptors.
		permissionsFromProtectionLevel: function (protectionLevel) {

			// ReSharper disable InconsistentNaming
			var PERMISSION_READ = 1;
			var PERMISSION_READ_ENCRYPTED = 2;
			var PERMISSION_READ_ENCRYPTED_MITM = 4;
			var PERMISSION_WRITE = 16;
			var PERMISSION_WRITE_ENCRYPTED = 32;
			var PERMISSION_WRITE_ENCRYPTED_MITM = 64;
			var PERMISSION_WRITE_SIGNED = 128;
			var PERMISSION_WRITE_SIGNED_MITM = 256;
			// ReSharper restore InconsistentNaming

			var permissions = 0;

			switch (protectionLevel) {
				case winble.gatt.GattProtectionLevel.plain:
					permissions = PERMISSION_READ | PERMISSION_WRITE;
					break;
				case winble.gatt.GattProtectionLevel.authenticationRequired:
					permissions = PERMISSION_READ | PERMISSION_WRITE_SIGNED;
					break;
				case winble.gatt.GattProtectionLevel.encryptionRequired:
					permissions = PERMISSION_READ_ENCRYPTED | PERMISSION_WRITE_ENCRYPTED;
					break;
				case winble.gatt.GattProtectionLevel.encryptionAndAuthenticationRequired:
					permissions = PERMISSION_READ_ENCRYPTED | PERMISSION_WRITE_ENCRYPTED | PERMISSION_WRITE_SIGNED;
					break;
			}

			return (permissions);
		},

		// Called from the descriptors API; return a list of all BLE descriptors associated with the specified device+characteristic.
		getCharacteristicDescriptors: function (successCallback, errorCallback, deviceHandle, charHandle) {

			winble.logger.logDebug("getCharacteristicDescriptors", "deviceHandle='" + deviceHandle + ", charHandle='" + charHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "getCharacteristicDescriptors", errorCallback);
			if (device == null)
				return;

			// Find the requested characteristic in the device's list of characteristics
			var characteristic = winble.deviceManager.getCharacteristicFromHandle(device, charHandle, "getCharacteristicDescriptors", errorCallback);
			if (characteristic == null)
				return;

			// Enumerate the descriptors on this characteristic
			var descList = characteristic.gattChar.getAllDescriptors();

			// Store the descriptors and return an API-specified list to the caller
			var descListOut = [];
			for (var i = 0; i < descList.length; i++) {

				// Add descriptor internally to the device so we can retrieve it later by its handle
				winble.logger.logDebug("getCharacteristicDescriptors", "Found " + characteristic.gattChar.uuid + " descriptor '" + descList[i].uuid + "'");
				var descStore = {
					"gattDesc": descList[i],
					"handle": winble.nextGattHandle++
				};
				device.descList[descStore.handle] = descStore;

				// Add characteristic to return list
				var charOut = {
					"handle": descStore.handle,
					"uuid": descStore.gattDesc.uuid,

					// TODO: Not at all sure if this is right as Microsoft has 1 of 4 values in this field and iOS/Android
					// TODO: have a bitfield, but see code in winble.deviceManager.permissionsFromProtectionLevel
					// TODO: as I try to map Microsoft's number to a bitfield.
					"permissions": winble.deviceManager.permissionsFromProtectionLevel(descStore.gattDesc.protectionLevel)
				};
				descListOut.push(charOut);
			}

			// Report the list of descriptors back to the caller
			successCallback(descListOut);
		},

		// Called from the readCharacteristic API; return the specified characteristic.
		readCharacteristic: function (successCallback, errorCallback, deviceHandle, charHandle) {

			winble.logger.logDebug("readCharacteristic", "deviceHandle='" + deviceHandle + ", charHandle='" + charHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "readCharacteristic", errorCallback);
			if (device == null)
				return;

			// Find the requested characteristic in the device's list of characteristics
			var characteristic = winble.deviceManager.getCharacteristicFromHandle(device, charHandle, "readCharacteristic", errorCallback);
			if (characteristic == null)
				return;

			// Read and return the data
			// https://msdn.microsoft.com/en-us/library/windows/apps/windows.devices.bluetooth.genericattributeprofile.gattcharacteristic.readvalueasync.aspx
			//characteristic.gattChar.readValueAsync(Windows.Devices.Bluetooth.BluetoothCacheMode.uncached).done(
			characteristic.gattChar.readValueAsync(Windows.Devices.Bluetooth.BluetoothCacheMode.cached).done(
				function (readResult) {
					if (readResult.status == winble.gatt.GattCommunicationStatus.success) {
						var dataOut = new Uint8Array(readResult.value.length);
						var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(readResult.value);
						dataReader.readBytes(dataOut);
						winble.logger.logDebug("readCharacteristic", "gattChar.readValueAsync completed with success, returning '" + dataOut + "'");
						successCallback(dataOut);
					} else {
						winble.logger.logDebug("readCharacteristic", "gattChar.readValueAsync completed with error");
						var msg = "Read failed or device unreachable, GattCommunicationStatus = " + readResult.status;
						winble.logger.logError("readCharacteristic", msg);
						errorCallback(msg);
					}
				},
				function (error) {
					var msg = "gattChar.readValueAsync() failed: " + error;
					winble.logger.logError("readCharacteristic", msg);
					errorCallback(msg);
				});
		},

		// Called from the readDescriptor API; return the specified descriptor.
		readDescriptor: function (successCallback, errorCallback, deviceHandle, descHandle) {

			winble.logger.logDebug("readDescriptor", "deviceHandle='" + deviceHandle + ", descHandle='" + descHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "readDescriptor", errorCallback);
			if (device == null)
				return;

			// Find the requested descriptor in the device's list of descriptors
			var descriptor = winble.deviceManager.getDescriptorFromHandle(device, descHandle, "readDescriptor", errorCallback);
			if (descriptor == null)
				return;

			// Read and return the data
			// https://msdn.microsoft.com/en-us/library/windows/apps/windows.devices.bluetooth.genericattributeprofile.gattdescriptor.readvalueasync.aspx
			//descriptor.gattDesc.readValueAsync(Windows.Devices.Bluetooth.BluetoothCacheMode.uncached).done(
			descriptor.gattDesc.readValueAsync(Windows.Devices.Bluetooth.BluetoothCacheMode.cached).done(
				function (readResult) {
					if (readResult.status == winble.gatt.GattCommunicationStatus.success) {
						var dataOut = new Uint8Array(readResult.value.length);
						var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(readResult.value);
						dataReader.readBytes(dataOut);
						winble.logger.logDebug("readDescriptor", "gattDesc.readValueAsync completed with success, returning '" + dataOut + "'");
						successCallback(dataOut);
					} else {
						winble.logger.logDebug("readDescriptor", "gattDesc.readValueAsync completed with error");
						var msg = "Read failed or device unreachable, GattCommunicationStatus = " + readResult.status;
						winble.logger.logError("readDescriptor", msg);
						errorCallback(msg);
					}
				},
				function (error) {
					var msg = "gattDesc.readValueAsync() failed: " + error;
					winble.logger.logError("readDescriptor", msg);
					errorCallback(msg);
				});
		},

		// Called from the writeCharacteristic API; write the data to the specified characteristic.
		writeCharacteristic: function (successCallback, errorCallback, deviceHandle, charHandle, dataBuffer) {

			winble.logger.logDebug("writeCharacteristic", "deviceHandle='" + deviceHandle + ", charHandle='" + charHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "writeCharacteristic", errorCallback);
			if (device == null)
				return;

			// Find the requested characteristic in the device's list of characteristics
			var characteristic = winble.deviceManager.getCharacteristicFromHandle(device, charHandle, "writeCharacteristic", errorCallback);
			if (characteristic == null)
				return;

			// Write the data. The incoming buffer is and ArrayBuffer, and the writeValueAsync() function takes an iBuffer as its
			// parameter, so we need to do some conversion here.
			// https://msdn.microsoft.com/en-us/library/windows/apps/windows.security.cryptography.cryptographicbuffer.createfrombytearray
			// https://msdn.microsoft.com/en-us/library/windows/apps/windows.devices.bluetooth.genericattributeprofile.gattcharacteristic.readvalueasync.aspx
			var data = new Uint8Array(dataBuffer);
			var dataOut = Windows.Security.Cryptography.CryptographicBuffer.createFromByteArray(data);
			var writeOption;
			if (characteristic.gattChar.characteristicProperties & winble.gatt.GattCharacteristicProperties.writeWithoutResponse)
				writeOption = winble.gatt.GattWriteOption.writeWithoutResponse;
			else
				writeOption = winble.gatt.GattWriteOption.writeWithResponse;
			characteristic.gattChar.writeValueAsync(dataOut, writeOption).done(
				function (commStatus) {
					if (commStatus == winble.gatt.GattCommunicationStatus.success) {
						winble.logger.logDebug("writeCharacteristic", "gattChar.writeValueAsync completed with success");
						successCallback();
					} else {
						winble.logger.logDebug("writeCharacteristic", "gattChar.writeValueAsync completed with error");
						var msg = "Write failed or device unreachable, GattCommunicationStatus = " + commStatus;
						winble.logger.logError("writeCharacteristic", msg);
						errorCallback(msg);
					}
				},
				function (error) {
					var msg = "gattChar.writeValueAsync() failed: " + error;
					winble.logger.logError("writeCharacteristic", msg);
					errorCallback(msg);
				});
		},

		// Called from the writeDescriptor API; write the data to the specified descriptor.
		writeDescriptor: function (successCallback, errorCallback, deviceHandle, descHandle, dataBuffer) {

			winble.logger.logDebug("writeDescriptor", "deviceHandle='" + deviceHandle + ", descHandle='" + descHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "writeDescriptor", errorCallback);
			if (device == null)
				return;

			// Find the requested descriptor in the device's list of descriptors
			var descriptor = winble.deviceManager.getDescriptorFromHandle(device, descHandle, "writeDescriptor", errorCallback);
			if (descriptor == null)
				return;

			// Write the data. The incoming buffer is and ArrayBuffer, and the writeValueAsync() function takes an iBuffer as its
			// parameter, so we need to do some conversion here.
			// https://msdn.microsoft.com/en-us/library/windows/apps/windows.security.cryptography.cryptographicbuffer.createfrombytearray
			// https://msdn.microsoft.com/en-us/library/windows/apps/windows.devices.bluetooth.genericattributeprofile.gattdescriptor.writevalueasync.aspx
			var data = new Uint8Array(dataBuffer);
			var dataOut = Windows.Security.Cryptography.CryptographicBuffer.createFromByteArray(data);
			descriptor.gattDesc.writeValueAsync(dataOut).done(
				function (commStatus) {
					if (commStatus == winble.gatt.GattCommunicationStatus.success) {
						winble.logger.logDebug("writeDescriptor", "gattDesc.writeValueAsync completed with success");
						successCallback();
					} else {
						winble.logger.logDebug("writeDescriptor", "gattDesc.writeValueAsync completed with error");
						var msg = "Write failed or device unreachable, GattCommunicationStatus = " + commStatus;
						winble.logger.logError("writeDescriptor", msg);
						errorCallback(msg);
					}
				},
				function (error) {
					var msg = "gattDesc.writeValueAsync() failed: " + error;
					winble.logger.logError("writeDescriptor", msg);
					errorCallback(msg);
				});
		},

		// Called from the enableCharacteristicNotification API; set things up such that the caller's callback
		// function is invoked whenever the value of the specified characteristic changes.
		enableCharacteristicNotification: function (successCallback, errorCallback, deviceHandle, charHandle) {

			winble.logger.logDebug("enableCharacteristicNotification", "deviceHandle='" + deviceHandle + ", charHandle='" + charHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "enableCharacteristicNotification", errorCallback);
			if (device == null)
				return;

			// Find the requested characteristic in the device's list of characteristics
			var characteristic = winble.deviceManager.getCharacteristicFromHandle(device, charHandle, "enableCharacteristicNotification", errorCallback);
			if (characteristic == null)
				return;

			// Make sure this characteristic supports sending of notifications, notify caller if not.
			if (!(characteristic.gattChar.characteristicProperties & winble.gatt.GattCharacteristicProperties.notify)) {
				var msg = "This characteristic does not support notifications";
				winble.logger.logDebug("enableCharacteristicNotification", msg);
				errorCallback(msg);
				return;
			}

			// Create callback to handle notifications; here we will get the new value into a UTF8 buffer and send it to the caller
			characteristic.onValueChanged = function (args) {
				winble.logger.logDebug("enableCharacteristicNotification", "** Windows called our callback! **");
				var data = Uint8Array(args.characteristicValue.length);
				Windows.Storage.Streams.DataReader.fromBuffer(args.characteristicValue).readBytes(data);
				successCallback(data, { keepCallback: true });
			};

			// Register the callback
			try {
				characteristic.gattChar.addEventListener("valuechanged", characteristic.onValueChanged, false);
			} catch (e) {
				var msg = "Could not add event listener:" + e;
				winble.logger.logError("enableCharacteristicNotification", msg);
				errorCallback(msg);
				return;
			}

			// Tell the characteristic to start sending us notifications.
			// In order to avoid unnecessary communication with the device, first determine if the device is already
			// correctly configured to send notifications. By default ReadClientCharacteristicConfigurationDescriptorAsync
			// will attempt to get the current value from the system cache, so physical communication with the device
			// is not typically required.
			characteristic.gattChar.readClientCharacteristicConfigurationDescriptorAsync().then(
				function (currentDescriptorValue) {

					// No need to configure characteristic to send notifications if it's already configured
					if ((currentDescriptorValue.status !== winble.gatt.GattCommunicationStatus.success) ||
					(currentDescriptorValue.clientCharacteristicConfigurationDescriptor !==
						winble.gatt.GattClientCharacteristicConfigurationDescriptorValue.notify)) {

						// Set the Client Characteristic Configuration Descriptor to enable the device to send
						// notifications when the Characteristic value changes.
						winble.logger.logDebug("enableCharacteristicNotification", "Configuring characteristic for notifications");
						characteristic.gattChar.writeClientCharacteristicConfigurationDescriptorAsync(
							winble.gatt.GattClientCharacteristicConfigurationDescriptorValue.notify).then(
							function (commStatus) {
								if (commStatus == winble.gatt.GattCommunicationStatus.success) {
									winble.logger.logDebug("enableCharacteristicNotification", "gattChar.writeClientCharacteristicConfigurationDescriptorAsync completed with success");
								} else {
									var msg = "Could not configure characteristic for notifications, device unreachable. GattCommunicationStatus = " + commStatus;
									winble.logger.logError("enableCharacteristicNotification", "enableCharacteristicNotification", msg);
									errorCallback(msg);
								}
							});
					} else {
						winble.logger.logDebug("enableCharacteristicNotification", "Characteristic is already configured for notifications");
					}
				});
		},

		// Called from the disableCharacteristicNotification API; stop calling the caller's callback
		// function when the value of the specified characteristic changes.
		disableCharacteristicNotification: function (successCallback, errorCallback, deviceHandle, charHandle) {

			winble.logger.logDebug("disableCharacteristicNotification", "deviceHandle='" + deviceHandle + ", charHandle='" + charHandle + "'");

			// Find the requested device in our list of discovered devices
			var device = winble.deviceManager.getDeviceFromHandle(deviceHandle, "disableCharacteristicNotification", errorCallback);
			if (device == null)
				return;

			// Find the requested characteristic in the device's list of characteristics
			var characteristic = winble.deviceManager.getCharacteristicFromHandle(device, charHandle, "disableCharacteristicNotification", errorCallback);
			if (characteristic == null)
				return;

			// Unregister the callback
			try {
				characteristic.gattChar.removeEventListener("valuechanged", characteristic.onValueChanged, false);
			} catch (e) {
				var msg = "Could not remove event listener:" + e;
				winble.logger.logError("disableCharacteristicNotification", msg);
				errorCallback(msg);
				return;
			}
		},

		// Called from the reset API to reset the BLE stack on the phone/tablet.
		turnBluetoothOffAndOn: function (successCallback, errorCallback) {

			// Windows does not provide a way to programmatically disable/enable the Bluetooth stack,
			// so we need to ask the user to do it for us. Display a dialog telling the user we're having trouble,
			// ask them to please toggle Bluetooth off-and-on on the next screen, and then take them to the
			// Bluetooth Settings screen.
			var dialogCallback = function (buttonNumber) {
				winble.logger.logDebug("turnBluetoothOffAndOn", "User clicked " + buttonNumber);
				if (buttonNumber == 1) {
					var uri = new Windows.Foundation.Uri("ms-settings-bluetooth:");
					Windows.System.Launcher.launchUriAsync(uri).done(
						function (launchSucceeded) {
							winble.logger.logDebug("turnBluetoothOffAndOn", "launchUriAsync returned " + launchSucceeded);
							successCallback();
						});
				} else {
					errorCallback("User declined to reset device");
				}
			};
			var prompt = "This device is having trouble communicating with your external Bluetooth devices;";
			prompt += " turning Bluetooth off and back on again in the Bluetooth Settings panel may fix the problem.";
			prompt += " Do you want to try that now?";
			navigator.notification.confirm(prompt, dialogCallback, "Reset Bluetooth?", ["Yes", "No"]);
		}
	}
};

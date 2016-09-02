// Demo of the BLE plugin API.

// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{

// UUIDs of services and characteristics.
var LUXOMETER_SERVICE = 'f000aa70-0451-4000-b000-000000000000'
var LUXOMETER_CONFIG = 'f000aa72-0451-4000-b000-000000000000'
var LUXOMETER_DATA = 'f000aa71-0451-4000-b000-000000000000'

// Handle of connected device.
var deviceHandle

// Characteristics.
var luxometerConfigCharacteristic
var luxometerDataCharacteristic

function initialize()
{
	// Extend plugin API with new functions (see file new-api.js).
	extendBLEPluginAPI()
	
	// Start scanning for a device.
	findDevice()
}
	
function findDevice()
{
	showMessage('Scanning for the TI SensorTag CC2650...')
	
	// Start scanning. Two callback functions are specified.
	evothings.ble.startScan(
		['0000aa10-0000-1000-8000-00805f9b34fb'],
		deviceFound,
		scanError)

	// This function is called when a device is detected, here
	// we check if we found the device we are looking for.
	function deviceFound(device)
	{
		showMessage('Found device: ' + device.name)
		
		evothings.ble.ensureAdvertisementData(device)
		
		showMessage('Found device: ' + device.advertisementData.kCBAdvDataLocalName)
		
		//console.log(JSON.stringify(device.advertisementData))
		//"kCBAdvDataServiceUUIDs":["0000aa10-0000-1000-8000-00805f9b34fb"]
		
		// Alternative ways to identify the device.
		
		if (device.advertisementData.kCBAdvDataServiceUUIDs.indexOf(
			'0000aa10-0000-1000-8000-00805f9b34fb') > -1)
		{
			showMessage('@@1 Found the TI SensorTag!')
		}
	
		var advertisedServiceUUIDs = device.advertisementData.kCBAdvDataServiceUUIDs
		if (advertisedServiceUUIDs.indexOf('0000aa10-0000-1000-8000-00805f9b34fb') > -1)
		{
			showMessage('@@2 Found the TI SensorTag!')
		}
		
		if (device.advertisementData.kCBAdvDataLocalName == 'CC2650 SensorTag')
		{
			showMessage('Found the TI SensorTag!')
			
			// Stop scanning.
			evothings.ble.stopScan()
		
			// Connect.
			connectToDevice(device)
		}
	}

	// Function called when a scan error occurs.
	function scanError(error)
	{
		showMessage('Scan error: ' + error)
	}
}

function connectToDevice(device)
{
	evothings.ble.connect(device.address, connectSuccess, connectError)
	
	function connectSuccess(connectInfo)
	{
		if (connectInfo.state == evothings.ble.connectionState.STATE_CONNECTED)
		{
			// Save device handle.
			deviceHandle = connectInfo.deviceHandle
		
			showMessage('Connected to device, reading services...')
	
			// Read all services, characteristics and descriptors.
			evothings.ble.readAllServiceData(
				deviceHandle,
				readServicesSuccess, 
				readServicesError)
				// Options not implemented.
				// { serviceUUIDs: [LUXOMETER_SERVICE] }
		}
		if (connectInfo.state == evothings.ble.connectionState.STATE_DISCONNECTED)
		{
			showMessage('Device disconnected')
		}
	}

	function readServicesSuccess(services)
	{
		showMessage('Reading services completed')
		
		// Get Luxometer service and characteristics.
		var service = evothings.ble.getService(services, LUXOMETER_SERVICE)
		var configCharacteristic = evothings.ble.getCharacteristic(service, LUXOMETER_CONFIG)
		var dataCharacteristic = evothings.ble.getCharacteristic(service, LUXOMETER_DATA)
	
		// Enable notifications for Luxometer.
		enableLuxometerNotifications(configCharacteristic, dataCharacteristic)
		//readLuxometer()
	}

	function readServicesError(error)
	{
		showMessage('Read services error: ' + error)
	}

	// Function called when a connect error or disconnect occurs.
	function connectError(error)
	{
		showMessage('Connect error: ' + error)
	}
}

// Use notifications to get the luxometer value.
function enableLuxometerNotifications(configCharacteristic, dataCharacteristic)
{
	// Turn Luxometer ON.
	evothings.ble.writeCharacteristic(
		deviceHandle,
		configCharacteristic.handle,
		new Uint8Array([1]),
		turnOnLuxometerSuccess,
		turnOnLuxometerError)

	// Enable notifications from the Luxometer.
	evothings.ble.enableNotification(
		deviceHandle,
		dataCharacteristic.handle,
		readLuxometerSuccess,
		readLuxometerError)

	function turnOnLuxometerSuccess()
	{
		showMessage('Luxometer is ON')
	
	}
	function turnOnLuxometerError(error)
	{
		showMessage('Write Luxometer error: ' + error)
	}

	/*
	function readLuxometerSuccess(data)
	{
		// Get raw sensor value (data buffer has little endian format).
		var raw = new DataView(data).getUint16(0, true)
		showMessage('Raw Luxometer value: ' + raw)
	}
	*/

	// Called repeatedly until disableNotification is called.
	function readLuxometerSuccess(data)
	{
		var lux = calculateLux(data)
		showMessage('Luxometer value: ' + lux)
	}
	
	function readLuxometerError(error)
	{
		showMessage('Read Luxometer error: ' + error)
	}
}

// Read the luxometer characteristic  using an interval timer to update the reading.
// Notifications are usually the preferred method, however. See enableLuxometerNotifications above.
function readLuxometer(configCharacteristic, dataCharacteristic)
{
	// Turn Luxometer ON.
	device.writeCharacteristic(
		LUXOMETER_SERVICE,
		LUXOMETER_CONFIG,
		new Uint8Array([1]),
		turnOnLuxometerSuccess,
		turnOnLuxometerError)

	setInterval(
		function() 
		{
			device.readCharacteristic(
				LUXOMETER_SERVICE,
				LUXOMETER_DATA,
				readLuxometerSuccess,
				readLuxometerError) 
		},
		2000)
	
	function turnOnLuxometerSuccess()
	{
		showMessage('Luxometer is ON')
	
	}
	function turnOnLuxometerError(error)
	{
		showMessage('Write Luxometer error: ' + error)
	}
	
	/*
	// How to get the raw sensor value.
	function readLuxometerSuccess(data)
	{
		// Get raw sensor value (data buffer has little endian format).
		var raw = new DataView(data).getUint16(0, true)
		showMessage('Raw Luxometer value: ' + raw)
	}
	*/
	
	// Called repeatedly until disableNotification is called.
	function readLuxometerSuccess(data)
	{
		var lux = calculateLux(data)
		showMessage('Luxometer value: ' + lux)
	}
	
	function readLuxometerError(error)
	{
		showMessage('Read Luxometer error: ' + error)
	}
}

// Calculate the light level from raw sensor data. 
// Return light level in lux.
function calculateLux(data)
{
	// Get 16 bit value from data buffer in little endian format.
	var value = new DataView(data).getUint16(0, true)

	// Extraction of luxometer value, based on sfloatExp2ToDouble
	// from BLEUtility.m in Texas Instruments TI BLE SensorTag
	// iOS app source code.
	var mantissa = value & 0x0FFF
	var exponent = value >> 12
	
	var magnitude = Math.pow(2, exponent)
	var output = (mantissa * magnitude)

	var lux = output / 100.0

	// Return result.
	return lux
}

function showMessage(text)
{
	document.querySelector('#message').innerHTML = text
	console.log(text)
}

// Start scanning for devices when the plugin has loaded.
document.addEventListener('deviceready', initialize, false)

})(); // End of closure.

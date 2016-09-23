// Demo of the EasyBLE library (this library is deprecated,
// use the updated BLE plugin API which uses a high-level style).

// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{

// UUIDs of services and characteristics.
var LUXOMETER_SERVICE = 'f000aa70-0451-4000-b000-000000000000'
var LUXOMETER_CONFIG = 'f000aa72-0451-4000-b000-000000000000'
var LUXOMETER_DATA = 'f000aa71-0451-4000-b000-000000000000'

function initialize()
{
	// Start scanning for a device.
	findDevice()
}

function findDevice()
{
	showMessage('Scanning for the TI SensorTag CC2650...')

	// Start scanning. Two callback functions are specified.
	evothings.easyble.startScan(
		deviceFound,
		scanError,
		{ serviceUUIDs: ['0000aa10-0000-1000-8000-00805f9b34fb'] })

	// This function is called when a device is detected, here
	// we check if we found the device we are looking for.
	function deviceFound(device)
	{
		// For debugging, print advertisement data.
		//console.log(JSON.stringify(device.advertisementData))

		/*
		// Alternative way to identify the device by advertised service UUID.
		if (device.advertisementData.kCBAdvDataServiceUUIDs.indexOf(
			'0000aa10-0000-1000-8000-00805f9b34fb') > -1)
		{
			showMessage('Found the TI SensorTag!')
		}
		*/

		if (device.getName() == 'CC2650 SensorTag')
		{
			showMessage('Found the TI SensorTag!')

			// Stop scanning.
			evothings.easyble.stopScan()

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
	device.connect(connectSuccess, connectError)

	function connectSuccess(device)
	{
		showMessage('Connected to device, reading services...')

		// Read all services, characteristics and descriptors.
		device.readServices(
			readServicesSuccess,
			readServicesError,
			{ serviceUUIDs: [LUXOMETER_SERVICE] })
	}

	function readServicesSuccess(device)
	{
		showMessage('Reading services completed')

		// Enable notifications for Luxometer.
		enableLuxometerNotifications(device)
	}

	function readServicesError(error)
	{
		showMessage('Read services error: ' + error)
	}

	// Function called when a connect error or disconnect occurs.
	function connectError(error)
	{
		if (error == evothings.easyble.error.DISCONNECTED)
		{
			showMessage('Device disconnected')
		}
		else
		{
			showMessage('Connect error: ' + error)
		}
	}
}

// Use notifications to get the luxometer value.
function enableLuxometerNotifications(device)
{
	// Turn Luxometer ON.
	device.writeCharacteristic(
		LUXOMETER_SERVICE,
		LUXOMETER_CONFIG,
		new Uint8Array([1]),
		turnOnLuxometerSuccess,
		turnOnLuxometerError)

	// Enable notifications from the Luxometer.
	device.enableNotification(
		LUXOMETER_SERVICE,
		LUXOMETER_DATA,
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

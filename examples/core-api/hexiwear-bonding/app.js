// Demo of bonding using the BLE plugin API.
// This code is fairly experimental.

// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{

// UUIDs of services and characteristics of the HexiWear.
// Note that not all of these are used by this example.
// You can experiment with reading various characteristics
// by modifying this app.

var INFO_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb'
var INFO_MANUFACTURER = '00002a29-0000-1000-8000-00805f9b34fb'
var INFO_FIRMWARE = '00002a26-0000-1000-8000-00805f9b34fb'
var INFO_SERIAL = '00002a25-0000-1000-8000-00805f9b34fb'

var BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb'
var BATTERY_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb'

var MOTION_SERVICE = '00002000-0000-1000-8000-00805f9b34fb'
var MOTION_ACCELEROMETER = '00002001-0000-1000-8000-00805f9b34fb'
var MOTION_GYRO = '00002002-0000-1000-8000-00805f9b34fb'
var MOTION_MAGNET = '00002003-0000-1000-8000-00805f9b34fb'

var WEATHER_SERVICE = '00002010-0000-1000-8000-00805f9b34fb'
var WEATHER_AMBIENT = '00002011-0000-1000-8000-00805f9b34fb'
var WEATHER_TEMPERATURE = '00002012-0000-1000-8000-00805f9b34fb'
var WEATHER_HUMIDITY = '00002013-0000-1000-8000-00805f9b34fb'
var WEATHER_PRESSURE = '00002014-0000-1000-8000-00805f9b34fb'

var HEALTH_SERVICE = '00002020-0000-1000-8000-00805f9b34fb'
var HEALTH_HEART = '00002021-0000-1000-8000-00805f9b34fb'
var HEALTH_STEPS = '00002022-0000-1000-8000-00805f9b34fb'
var HEALTH_ACTIVITY = '00002023-0000-1000-8000-00805f9b34fb'

var MODE_SERVICE = '00002040-0000-1000-8000-00805f9b34fb'
var MODE_CHARACTERISTIC = '00002041-0000-1000-8000-00805f9b34fb'

// Connected device.
var mDevice = null

var mPollingTimer = null

function initialize()
{
	document.getElementById('connect').addEventListener(
		'click',
		//initiateTestSequence, // Used for testing.
		findDevice,
		false)
	document.getElementById('disconnect').addEventListener(
		'click',
		disconnectDevice,
		false)
	showMessage('Ready')
}

// Code used for testing repeated connect and disconnect.
var testCount = 0
var connectErrorCount = 0

function initiateTestSequence()
{
	testCount = 0

	console.log('Initiate test sequence')
	runTestSequence()
}

function runTestSequence()
{
	if (testCount < 10)
	{
		++testCount

		console.log('Running test sequence')
		console.log('testCount: ' + testCount)
		console.log('connectErrorCount: ' + connectErrorCount)

		findDevice()
		setTimeout(disconnectDevice, 20000)
		setTimeout(runTestSequence, 30000)
	}
	else
	{
		console.log('Test sequence done')
		console.log('testCount: ' + testCount)
		console.log('connectErrorCount: ' + connectErrorCount)

	}
}
// End of code used for testing.

function findDevice()
{
	disconnectDevice()

	// Used for debugging/testing.
	//scanForDevice()
	//return

	searchForBondedDevice({
		name: 'HEXIWEAR',
		serviceUUIDs: [INFO_SERVICE],
		onFound: connectToDevice,
		onNotFound: scanForDevice,
		})
}

function disconnectDevice()
{
	evothings.ble.stopScan()
	clearInterval(mPollingTimer)
	if (mDevice) { evothings.ble.close(mDevice) }
	mDevice = null
	showMessage('Disconnected')
}

/**
 * Search for bonded device with a given name.
 * Useful if the address is not known.
 */
function searchForBondedDevice(params)
{
	console.log('Searching for bonded device')
	evothings.ble.getBondedDevices(
		// Success function.
		function(devices)
		{
			for (var i in devices)
			{
				var device = devices[i]
				if (device.name == params.name)
				{
					console.log('Found bonded device: ' + device.name)
					params.onFound(device)
					return // bonded device found
				}
			}
			params.onNotFound()
		},
		// Error function.
		function(error)
		{
			params.onNotFound()
		},
		{ serviceUUIDs: params.serviceUUIDs })
}

function scanForDevice()
{
	showMessage('Scanning for HexiWear')

	// Start scanning. Two callback functions are specified.
	evothings.ble.startScan(
		onDeviceFound,
		onScanError)

	// This function is called when a device is detected, here
	// we check if we found the device we are looking for.
	function onDeviceFound(device)
	{
		console.log('Found device: ' + device.name)

		if (device.advertisementData.kCBAdvDataLocalName == 'HEXIWEAR')
		{
			showMessage('Found HexiWear Sensor Tag')

			// Stop scanning.
			evothings.ble.stopScan()

			// Connect directly.
			// Used for debugging/testing.
			//connectToDevice(device)
			//return

			// Bond and connect.
			evothings.ble.bond(
				device,
				function(state)
				{
					// Android returns 'bonded' when bonding is complete.
					// iOS will return 'unknown' and show paring dialog
					// when connecting.
					if (state == 'bonded' || state == 'unknown')
					{
						connectToDevice(device)
					}
					else if (state == 'bonding')
					{
						showMessage('Bonding in progress')
					}
					else if (state == 'unbonded')
					{
						showMessage('Bonding aborted')
					}
				},
				function(error)
				{
					showMessage('Bond error: ' + error)
				})
		}
	}

	// Function called when a scan error occurs.
	function onScanError(error)
	{
		showMessage('Scan error: ' + error)
	}
}

function connectToDevice(device)
{
	showMessage('Connecting to device...')

	// Save device.
	mDevice = device

	// Android connect error 133 might be prevented by waiting a
	// little before connect (to make sure previous BLE operation
	// has completed).
	setTimeout(
		function()
		{
			evothings.ble.connectToDevice(
				device,
				onConnected,
				onDisconnected,
				onConnectError)
		},
	    500)

	function onConnected(device)
	{
		showMessage('Connected')
		testIfBonded()
	}

	function onDisconnected(device)
	{
		showMessage('Device disconnected')
	}

	// Function called when a connect error or disconnect occurs.
	function onConnectError(error)
	{
		++connectErrorCount
		showMessage('Connect error: ' + error)

		// If we get Android connect error 133, we wait and try to connect again.
		// This can resolve connect problems on Android when error 133 is seen.
		// In a production app you may want to have a function for aborting or
		// maximising the number of connect attempts. Note that attempting reconnect
		// does not block the app however, so you can still do other tasks and
		// update the UI of the app.
		if (133 == error)
		{
			showMessage('Reconnecting...')
			setTimeout(function() { connectToDevice(device) }, 1000)
		}
	}
}

function testIfBonded()
{
	console.log('test if bonded')

	// Read encrypted characteristic to test if device is bonded.
	// This will fail (on iOS) if not bonded.
	var service = evothings.ble.getService(mDevice, WEATHER_SERVICE)
	var characteristic = evothings.ble.getCharacteristic(service, WEATHER_TEMPERATURE)
	evothings.ble.readCharacteristic(
		mDevice,
		characteristic,
		function(data)
		{
		console.log('bonded')
			// We are bonded. Continue to read device data.
			readDevice()
		},
		function(errorCode)
		{
			// Not bonded, try again.
			console.log('not bonded')
			showMessage('Device not bonded. Please Connect again.')
		})
}

function readDevice()
{
	showMessage('Reading device data')

	// Read static device data.
	readCharacteristic(
		mDevice,
		INFO_SERVICE,
		INFO_MANUFACTURER,
		'device-manufacturer',
		dataToAscii)

	readCharacteristic(
		mDevice,
		INFO_SERVICE,
		INFO_FIRMWARE,
		'device-firmware',
		dataToAscii)

	// Periodically read accelerometer.
	clearInterval(mPollingTimer)
	mPollingTimer = setInterval(
		function()
		{
			readAccelerometer()
			readTemperature()
		},
		1000)
}

function readCharacteristic(device, serviceUUID, characteristicUUID, elementId, dataConversionFunction)
{
	var service = evothings.ble.getService(device, serviceUUID)
	var characteristic = evothings.ble.getCharacteristic(service, characteristicUUID)
	evothings.ble.readCharacteristic(
		device,
		characteristic,
		function(data)
		{
			document.getElementById(elementId).innerHTML =
				dataConversionFunction(data)
		},
		function(errorCode)
		{
			showMessage('readCharacteristic error: ' + errorCode)
		})
}

function readAccelerometer()
{
	readCharacteristic(
		mDevice,
		MOTION_SERVICE,
		MOTION_ACCELEROMETER,
		'device-accelerometer',
		convert3x16bitDataToString)
}

function readTemperature()
{
	readCharacteristic(
		mDevice,
		WEATHER_SERVICE,
		WEATHER_TEMPERATURE,
		'device-temperature',
		convertTemperatureDataToString)
}

function dataToAscii(data)
{
	return String.fromCharCode.apply(null, new Uint8Array(data))
}

function convert3x16bitDataToString(data)
{
	var array = new Int16Array(data)
	return array[0] + ' ' + array[1] + ' ' + array[2]
}

function convertTemperatureDataToString(data)
{
	return (new Int16Array(data)[0]) / 100.0
}

function showMessage(text)
{
	document.querySelector('#message').innerHTML = text
	console.log(text)
}

// Start scanning for devices when the plugin has loaded.
document.addEventListener('deviceready', initialize, false)

})(); // End of closure.

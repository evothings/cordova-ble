// Demo of the high-level extended BLE plugin API.

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

var mConnectInProgress = false

var mPollingTimer = null

function initialize()
{
	document.getElementById('connect').addEventListener(
		'click',
		findDevice,
		false)
	document.getElementById('disconnect').addEventListener(
		'click',
		disconnectDevice,
		false)
	showMessage('Ready')
}

function findDevice()
{
	if (mConnectInProgress) return
	mConnectInProgress = true

	searchForBondedDevice({
		onFound: connectToDevice,
		onNotFound: scanForDevice,
		serviceUUIDs: [INFO_SERVICE]
		})
}

function disconnectDevice()
{
	clearInterval(mPollingTimer)
	evothings.ble.close(mDevice)
	mConnectInProgress = false
	showMessage('Disconnected')
}

function searchForBondedDevice(params)
{
	evothings.ble.getBondedDevices(
		// Success function.
		function(devices)
		{
			for (var i in devices)
			{
				var device = devices[i]
				if (device.name == 'HEXIWEAR')
				{
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

/*
// Not used.
function isDeviceBonded(params)
{
	evothings.ble.getBondedDevices(
		// Success function.
		function(devices)
		{
			for (var i in devices)
			{
				var device = devices[i]
				if (device.address == params.device.address)
				{
					params.onIsBonded(device)
					return
				}
			}
			params.onIsNotBonded()
		},
		// Error function.
		params.onIsNotBonded,
		{ serviceUUIDs: params.serviceUUIDs })
}
*/

function waitUntilBonded(params, timeout)
{
	if (timeout == undefined)
	{
		timeout = params.timeout
	}

	evothings.ble.getBondedDevices(
		// Success function.
		function(devices)
		{
			for (var i in devices)
			{
				var device = devices[i]
				if (device.address == params.device.address)
				{
					params.onBonded(params.device)
					return // bonded device found
				}
			}

			if (timeout > 500)
			{
				timeout -= 1000
				setTimeout(function() { waitUntilBonded(params, timeout) }, 1000)
			}
			else
			{
				params.onNotBonded(params.device)
			}
		},
		// Error function.
		function(error)
		{
			params.onNotBonded(params.device)
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
		if (device.advertisementData.kCBAdvDataLocalName == 'HEXIWEAR')
		{
			showMessage('Found HexiWear Sensor Tag')

			// Stop scanning.
			evothings.ble.stopScan()

			// Connect.
			connectToDevice(device)
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

	evothings.ble.connectToDevice(
		device,
		onConnected,
		onDisconnected,
		onConnectError)

	function onConnected(device)
	{
		showMessage('Connected')

		// Wait until we have bonded before reading device.
		waitUntilBonded({
			device: device,
			onBonded: readDevice,
			onNotBonded: deviceNotBonded,
			timeout: 10000,
			serviceUUIDs: [INFO_SERVICE]
			})
	}

	function onDisconnected(device)
	{
		disconnectDevice()
		showMessage('Device disconnected')
	}

	// Function called when a connect error or disconnect occurs.
	function onConnectError(error)
	{
		disconnectDevice()
		showMessage('Connect error: ' + error)
	}
}

function readDevice(device)
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
	mPollingTimer = setInterval(readAccelerometer, 1000)

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
			showMessage('readCharacteristic error: ' + errorCode);
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

function deviceNotBonded(device)
{
	//disconnectDevice()
	showMessage('Device not bonded')

	// Lets try reading anyhow. This works on Android in
	// the "semi-bonded" state where the device is paired
	// but does not show up among bonded devices.
	readDevice()
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

function showMessage(text)
{
	document.querySelector('#message').innerHTML = text
	console.log(text)
}

// Start scanning for devices when the plugin has loaded.
document.addEventListener('deviceready', initialize, false)

})(); // End of closure.

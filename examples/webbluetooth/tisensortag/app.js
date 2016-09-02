// Demo of the Web Bluetooth API.

// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{

// UUIDs of services and characteristics.
var LUXOMETER_SERVICE = 'f000aa70-0451-4000-b000-000000000000'
var LUXOMETER_CONFIG = 'f000aa72-0451-4000-b000-000000000000'
var LUXOMETER_DATA = 'f000aa71-0451-4000-b000-000000000000'

// Variables.
var gattServer
var luxometerService

// Main application function.
function startLuxometerNotifications()
{
	showMessage('Scanning...')

	bleat.requestDevice(
	{
		filters:[{ name: 'CC2650 SensorTag' }]
	})
	.then(function(device)
	{
		showMessage('Found device: ' + device.name)
		return device.gatt.connect()
	})
	.then(function(server)
	{
		gattServer = server
		showMessage('Connected')
		return gattServer.getPrimaryService(LUXOMETER_SERVICE)
	})
	.then(function(service)
	{
		// Get config characteristic.
		luxometerService = service
		return luxometerService.getCharacteristic(LUXOMETER_CONFIG)
	})
	.then(function(characteristic)
	{
		// Turn luxometer config to ON.
		return characteristic.writeValue(new Uint8Array([1]))
	})
	.then(function()
	{
		// Get data characteristic.
		return luxometerService.getCharacteristic(LUXOMETER_DATA)
	})
	.then(function(characteristic)
	{
		// Start sensor notification.
		showMessage('Starting notfications')
		characteristic.addEventListener('characteristicvaluechanged', onLuxometerChanged)
  		return characteristic.startNotifications()
	})
	.catch(function(error)
	{
		showMessage(error)
	})
}

// This is how to disconnect from the device.
function stopLuxometerNotifications()
{
	if (gattServer && gattServer.connected)
	{
		gattServer.disconnect()
	}

	showMessage('Disconnected')
}

// Notification callback function.
function onLuxometerChanged(event)
{
	var characteristic = event.target
	var lux = calculateLux(characteristic.value)
	showMessage('Luxometer value: ' + lux)
}

// Calculate the light level from raw sensor data.
// Return light level in lux.
function calculateLux(data)
{
	// Get 16 bit value from data buffer in little endian format.
	var value = data.getUint16(0, true)

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
document.addEventListener('deviceready', startLuxometerNotifications, false)

})(); // End of closure.

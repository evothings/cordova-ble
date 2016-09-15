// Application code starts here. The code is wrapped in a
// function closure to prevent overwriting global objects.
;(function()
{
	// Dictionary of devices.
	var devices = {}

	// Timer that displays list of devices.
	var timer = null

	function onDeviceReady()
	{
		// Start tracking devices!
		setTimeout(startScan, 1000)

		// Timer that refreshes the display.
		timer = setInterval(updateDeviceList, 1000)
	}

	function onBackButtonDown()
	{
		evothings.ble.stopScan()
		navigator.app.exitApp()
	}

	function startScan()
	{
		showMessage('Scan in progress')
		evothings.ble.startScan(
			// Eddystone Service UUID used as an example.
			// Remove or set this parameter to null to scan for all
			// devices regardless of advertised services.
			//['0000FEAA-0000-1000-8000-00805F9B34FB'],
			function(device)
			{
				//console.log('got device ' + device.name + ' ' + device.address)

				// Update device data.
				device.timeStamp = Date.now()
				devices[device.address] = device
			},
			function(error)
			{
				showMessage('BLE scan error: ' + error)
			})
	}

	// Map the RSSI value to a value between 1 and 100.
	function mapDeviceRSSI(rssi)
	{
		if (rssi >= 0) return 1 // Unknown RSSI maps to 1.
		if (rssi < -100) return 100 // Max RSSI
		return 100 + rssi
	}

	function getSortedDeviceList(devices)
	{
		var deviceList = []

		for (var key in devices)
		{
			deviceList.push(devices[key])
		}

		deviceList.sort(function(device1, device2)
		{
			return mapDeviceRSSI(device1.rssi) < mapDeviceRSSI(device2.rssi)
		})

		return deviceList
	}

	function updateDeviceList()
	{
		removeOldDevices()
		displayDevices()
	}

	function removeOldDevices()
	{
		var timeNow = Date.now()
		for (var key in devices)
		{
			// Only show devices updated during the last 60 seconds.
			var device = devices[key]
			if (device.timeStamp + 60000 < timeNow)
			{
				delete devices[key]
			}
		}
	}

	function displayDevices()
	{
		var html = ''
		var sortedList = getSortedDeviceList(devices)
		for (var i = 0; i < sortedList.length; ++i)
		{
			var device = sortedList[i]
			var htmlDevice =
				'<p>'
				+	htmlDeviceName(device)
				+	htmlDeviceRSSI(device)
				+ '</p>'
			html += htmlDevice
		}
		document.querySelector('#found-devices').innerHTML = html
	}

	function htmlDeviceName(device)
	{
		var name = device.name || 'no name'
		return '<strong>' + name + '</strong><br/>'
	}

	function htmlDeviceRSSI(device)
	{
		return device.rssi ?
			'RSSI: ' + device.rssi + '<br/>' :  ''
	}

	function showMessage(text)
	{
		document.querySelector('#message').innerHTML = text
		console.log(text)
	}

	// This calls onDeviceReady when Cordova has loaded everything.
	document.addEventListener('deviceready', onDeviceReady, false)

	// Add back button listener (for Android). Uncomment to activate.
	//document.addEventListener('backbutton', onBackButtonDown, false)

})(); // End of closure.

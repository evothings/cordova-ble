# Cordova BLE Plugin

This plugin implements BLE support for Android, iOS and Windows 8.1 (partial support). Enable your Cordova and PhoneGap mobile applications to communicate with all sorts of BLE devices.

Available functionality:

* Scan for BLE devices (background scanning supported on iOS and Android)
* Establish connections
* List services, characteristics and descriptors
* Read and write the values of characteristics and descriptors
* Request notification of changes to the values of characteristics
* Poll RSSI (signal strength) of a device (Android and iOS only)
* Experimental support for Peripheral mode on Android

## Installation

Install using the Apache Cordova command line:

    cordova plugin add cordova-plugin-ble

## Updated BLE Plugin API

We have extended the BLE plugin API to make it more high-level and easy to use.

Functions can now take objects as parameters.

The new plugin API is fully backwards compatible with the previous API, which used handles rather than objects.

We recommend using the new style with object parameters.

Below is tour of the new BLE plugin API.

## Quick Guide

### Scan for devices

Use function `evothings.ble.startScan` to scan for devices:

    evothings.ble.startScan(onDeviceFound, onScanError, options)

Starts scanning for devices. An array of service UUID strings may be given in the options object parameter. One or more service UUIDs must be specified for iOS background scanning to work. Found devices and errors are reported to the supplied callback functions. The startScan function will keep scanning until you call `evothings.ble.stopScan`.

Parameters:

    @param {scanCallback} onDeviceFound - Success callback, called repeatedly
    for each found device.
    @param {failCallback} onScanError - Error callback.
    @param {ScanOptions} options - Optional object with options.
    Set field serviceUUIDs to an array of service UUIDs to scan for.
    Set field parseAdvertisementData to false to disable automatic
    parsing of advertisement data.

Examples:

    // Scan for all services.
    evothings.ble.startScan(
        function(device)
        {
            console.log('startScan found device named: ' + device.name);
        },
        function(errorCode)
        {
            console.log('startScan error: ' + errorCode);
        }
    );

    // Scan for specific service (Eddystone Service UUID).
    evothings.ble.startScan(
        function(device)
        {
            console.log('startScan found device named: ' + device.name);
        },
        function(errorCode)
        {
            console.log('startScan error: ' + errorCode);
        },
        { serviceUUIDs: ['0000feaa-0000-1000-8000-00805f9b34fb'] }
    );


### Connect to a device

Use function `evothings.ble.connectToDevice` to connect to a device:

    evothings.ble.connectToDevice(device, onConnected, onDisconnected, onConnectError, options)

Connect to a BLE device and discover services. This is a more high-level
function than `evothings.ble.connect`. You can configure which services
to discover and also turn off automatic service discovery by supplying
an options parameter.

Parameters:

    @param {DeviceInfo} device - Device object from {scanCallback}.
    @param {connectedCallback} onConnected - Called when connected to the device.
    @param {disconnectedCallback} onDisconnected - Called when disconnected from the device.
    @param {failCallback} onConnectError - Called on error.
    @param {ConnectOptions} options - Optional connect options object.

Example:

    evothings.ble.connectToDevice(
         device,
         function(device)
         {
             console.log('Connected to device: ' + device.name);
         },
         function(device)
         {
             console.log('Disconnected from device: ' + device.name);
         },
         function(errorCode)
         {
             console.log('Connect error: ' + errorCode);
         });

It is recommended to use this functions in place of the low-level `evothings.ble.connect` function, which does not do automatic service discovery and has a different callback interface.

### Get services, characteristics and descriptors

#### evothings.ble.getService

Use `evothings.ble.getService` to get a service by UUID:

    evothings.ble.getService(device, uuid)

Parameters:

    @param {DeviceInfo} device - Device object.
    @param {string} uuid - UUID of service to get.

#### evothings.ble.getCharacteristic

Use `evothings.ble.getCharacteristic` to get a characteristic by UUID:

    evothings.ble.getCharacteristic(service, uuid)

Parameters:

    @param {Service} device - Service object.
    @param {string} uuid - UUID of characteristic to get.

Characteristics within a service that share the same UUID (rare case) must be retrieved by manually traversing the characteristics array of the service. The function getCharacteristic will return the first characteristic found, which may not be the one you want. Note that this is a rare case.

#### evothings.ble.getDescriptor

Use `evothings.ble.getDescriptor` to get a characteristic by UUID:

    evothings.ble.getDescriptor(characteristic, uuid)

Parameters:

    @param {Characteristic} characteristic - Characteristic object.
    @param {string} uuid - UUID of descriptor to get.

### Reading, writing and notifications

#### evothings.ble.readCharacteristic

Use `evothings.ble.readCharacteristic` to write a characteristic:

    evothings.ble.readCharacteristic(device, characteristic, success, fail)

Parameters:

    @param {DeviceInfo} device - Device object.
    @param {Characteristic} characteristic - Characteristic object.
    @param {dataCallback} success
    @param {failCallback} fail

Example:

    // When connected to the device, get the desired service and characteristic.
    var service = evothings.ble.getService(device, SERVICE_UUID)
    var characteristic = evothings.ble.getCharacteristic(service, CHARACTERISTIC_UUID)

    // Read the characteristic.
    evothings.ble.readCharacteristic(
        device,
        characteristic,
        function(data)
        {
            console.log('characteristic data: ' + evothings.ble.fromUtf8(data));
        },
        function(errorCode)
        {
            console.log('readCharacteristic error: ' + errorCode);
        });


#### evothings.ble.writeCharacteristic

Use `evothings.ble.writeCharacteristic` to write a characteristic:

    evothings.ble.writeCharacteristic(device, characteristic, data, success, fail)

Parameters:

    @param {DeviceInfo} device - Device object.
    @param {Characteristic} characteristic - Characteristic object.
    @param {ArrayBufferView} data - The value to be written.
    @param {emptyCallback} success - Called when the remote device has
    confirmed the write.
    @param {failCallback} fail - Called if the operation fails.

Example:

    // When connected to the device, get the desired service and characteristic.
    var service = evothings.ble.getService(device, SERVICE_UUID)
    var characteristic = evothings.ble.getCharacteristic(service, CHARACTERISTIC_UUID)

    // Read the characteristic.
    evothings.ble.writeCharacteristic(
        device,
        characteristic,
        data, // Buffer view with data to write
        function()
        {
            console.log('characteristic written');
        },
        function(errorCode)
        {
            console.log('writeCharacteristic error: ' + errorCode);
        });

#### evothings.ble.enableNotification

Use `evothings.ble.enableNotification` to start notifications on a characteristic:

    evothings.ble.enableNotification(device, characteristic, success, fail)

Parameters:

    @param {DeviceInfo} device - Device object .
    @param {Characteristic} characteristic - Characteristic object.
    @param {dataCallback} success - Called every time the value changes.
    @param {failCallback} fail - Error callback.
    @param {NotificationOptions} options - Android only: Optional object with options.

Example:

    // When connected to the device, get the desired service and characteristic.
    var service = evothings.ble.getService(device, SERVICE_UUID)
    var characteristic = evothings.ble.getCharacteristic(service, CHARACTERISTIC_UUID)

    // Start notifications for the characteristic.
    evothings.ble.enableNotification(
        device,
        characteristic,
        function()
        function(data)
        {
            console.log('characteristic data: ' + evothings.ble.fromUtf8(data));
        },
        function(errorCode)
        {
            console.log('readCharacteristic error: ' + errorCode);
        });

## Documentation

The [BLE API Guide](http://evothings.com/doc/tutorials/evothings-ble-api-guide.html) contains step-by-step instructions for how to scan and connect to BLE devices.

Reference documentation is available as jsdoc comments in the [ble.js](https://github.com/evothings/cordova-ble/blob/master/ble.js) source file.

To build the documentation using [jsdoc](https://github.com/jsdoc3/jsdoc), run this command:

    jsdoc -l -c jsdoc/conf.json ble.js

[Generated documentation](https://evothings.com/doc/lib-doc/module-cordova-plugin-ble.html) is available at the Evothings documentation web site (note that this documentation may not reflect the latest updates of the plugin, it may lag to sync with Evothings releases).

<!--The file [introduction.md](introduction.md) contains a general introduction to BLE programming.-->

<!-- Read the [BLE app development tutorial](http://evothings.com/ble-app-development-explained/) to get started with your BLE mobile application. -->

## Libraries

This section lists libraries that runs on top of the BLE plugin.

### Web Bluetooth

Early support for Web Bluetooth is available using the Bleat library.

* Master repository: https://github.com/thegecko/bleat
* Example app: https://github.com/evothings/cordova-ble/blob/master/examples/webbluetooth
* Tutorial: https://evothings.com/evothings-studio-with-support-for-web-bluetooth-and-ecmascript-6/

### EasyBLE

The EasyBLE library has been deprecated and is replaced with the extended BLE plugin API.

### Eddystone

Library for scanning for Eddystone devices/beacons (Physical Web).

* Master repository:  https://github.com/evothings/evothings-libraries/tree/master/libs/evothings/eddystone
* Documentation: https://evothings.com/doc/lib-doc/evothings.eddystone.html
* Tutorial: https://evothings.com/doc/starter-guides/eddystone-starter-guide.html
* JavaScript file to include in index.html: https://github.com/evothings/evothings-libraries/tree/master/libs/evothings/eddystone/eddystone.dist.js

To use the Eddystone library, include this in index.html:

    <script src="eddystone.dist.js"></script>

## Use Evothings Studio for fast and easy BLE mobile app development

[![BLE Mobile App Development Video](http://evomedia.evothings.com/2013/11/youtube_ble_example_start.png)](http://www.youtube.com/watch?v=A7uxNS_0QOI)

This plugin is used in Evothings Studio, and is compatible with Apache Cordova and PhoneGap.

[Evothings Studio](http://evothings.com) is a development and prototyping tool for making Cordova/PhoneGap apps. With Evothings Studio the edit/run turn-around cycle is just a second or two, which is much faster compared to the traditional method of rebuilding the Cordova project for each update.

[![Evothings Studio Workflow](http://evomedia.evothings.com/2013/11/illustration_ble_plugin.jpg)](http://evothings.com)

See [Evothings Examples](http://evothings.com/doc/examples/examples.html) for comprehensive examples of mobile apps that communicate over Bluetooth Low Energy, and which you can use for your own projects to get quickly up and running.

## Download Evothings Studio

[Download Evothings Studio](http://evothings.com/download/) - It is easy to get started!

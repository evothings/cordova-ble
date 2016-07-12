## Cordova BLE Plugin

This plugin implements BLE support for Android, iOS and Windows 8.1 (partial support). Enable your Cordova and PhoneGap mobile applications to communicate with all sorts of BLE devices.

Available functionality:

* Scan for BLE devices (background scanning supported on iOS and Android)
* Establish connections
* List services, characteristics and descriptors
* Read and write the values of characteristics and descriptors
* Request notification of changes to the values of characteristics
* Poll RSSI (signal strength) of a device (Android and iOS only)
* Experimental support for Peripheral mode on Android

### Installation

Install using the Apache Cordova command line:

    cordova plugin add cordova-plugin-ble

### Documentation

Reference documentation is available in the [ble.js](https://github.com/evothings/cordova-ble/blob/master/ble.js) source file.

To build the documentation using [jsdoc](https://github.com/jsdoc3/jsdoc), run this command:

    jsdoc -l -c conf.json ble.js

[Generated documentation](https://evothings.com/doc/lib-doc/module-cordova-plugin-ble.html) is available at the Evothings documentation web site.

The file [introduction.md](introduction.md) contains a general introduction to BLE programming.

### Libraries

The plugin API is rather low-level and we recommend using the EasyBLE high-level library, which is built on top of the BLE plugin.

This library is now available as a single file: [easyble.dist.js](https://github.com/evothings/evothings-libraries/blob/master/libs/evothings/easyble/easyble.dist.js)

To use the library, just include the file in index.html:

    <script src="easyble.dist.js"></script>

List of libraries built on top of the BLE plugin:

* **EasyBLE** - BLE library (see BLE example apps that ship with Evothings Studio for code examples) ([code](https://github.com/evothings/evothings-libraries/tree/master/libs/evothings/easyble), [documentation](https://evothings.com/doc/lib-doc/evothings.easyble.html), [tutorial](https://evothings.com/doc/starter-guides/bluetooth-smart-starter-guide.html))
* **Eddystone** - library and Cordova plugin for scanning for Eddystone devices/beacons (Physical Web) ([Cordova Plugin](https://github.com/evothings/cordova-eddystone), [code](https://github.com/evothings/evothings-libraries/tree/master/libs/evothings/eddystone), [documentation](https://evothings.com/doc/lib-doc/evothings.eddystone.html), [tutorial](https://evothings.com/doc/starter-guides/eddystone-starter-guide.html))
* **Bleat** - library with support for Web Bluetooth ([code](https://github.com/evothings/evothings-libraries/tree/master/libs/bleat), [master repository](https://github.com/thegecko/bleat), [tutorial](https://evothings.com/evothings-studio-with-support-for-web-bluetooth-and-ecmascript-6/))

### Getting started tutorial

Read the [BLE app development tutorial](http://evothings.com/ble-app-development-explained/) to get started with your BLE mobile application.

[![BLE Mobile App Development Video](http://evomedia.evothings.com/2013/11/youtube_ble_example_start.png)](http://www.youtube.com/watch?v=A7uxNS_0QOI)

### Use Evothings Studio for fast and easy BLE mobile app development

This plugin is used in Evothings Studio, and is compatible with Apache Cordova and PhoneGap.

[Evothings Studio](http://evothings.com) is a development and prototyping tool for making Cordova/PhoneGap apps. With Evothings Studio the edit/run turn-around cycle is just a second or two, which is much faster compared to the traditional method of rebuilding the Cordova project for each update.

[![Evothings Studio Workflow](http://evomedia.evothings.com/2013/11/illustration_ble_plugin.jpg)](http://evothings.com)

See [Evothings Examples](http://evothings.com/doc/examples/examples.html) for comprehensive examples of mobile apps that communicate over Bluetooth Low Energy, and which you can use for your own projects to get quickly up and running.

### Download Evothings Studio

[Download Evothings Studio](http://evothings.com/download/) - it is fun and easy to get started. It is open source!

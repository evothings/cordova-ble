# Cordova BLE Test

The file test.html contains a test suite that performs the following:

    startScan
    For each device found:
      connect (10 times), close (9 times)
      stopScan (note this can be moved to allow time for
                more devices to be found)
      rssi (10 times with delay)
      services
        characteristics
          readCharacteristic
          descriptors
            readDescriptor

To run the test, build a Cordova app that contains the BLE plugin
and contains test.html as the main HTML file.

Alternatively run text.html from the EvoThingsClient app.

The UI of the test should be pretty self-explanatory. Click the
start button, wait and watch the result.

Observations: 

When calling descriptors, the error "Unknown error" happens
for some characteristics on tested BLE devices.

The error "CoreBluetooth[WARNING] Unknown error: 1309" has
been observed on iOS, but reproducing it has been unsuccessful.

http://stackoverflow.com/questions/20380561/ios-corebluetoothwarning-unknown-error-1309

On iOS, devices sometimes not discovered a second time when
rerunning the test. This has been observed with StickNFind.
The TI Sensor Tag works multiple times by pressing the "on/off"
button (however test must sometimes be restarted a second time
for device to be discovered again).

What would be needed is a way to disconnect devices.
TODO: Check the implementation of close on iOS and see if
a call must be made to forget the device.

Please feel free to contact us if you have any findings or
feedback you wish to share.

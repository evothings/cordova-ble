/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "BLE.h"

@implementation BLE

/****************************************************************/
/*                   BLE plugin API Methods                     */
/****************************************************************/

//////////////////////////////////////////////////////////////////
// TODO: Guard against parallel invocations of API calls.       //
// The API can only handle one scan, connect, etc call at once. //
//////////////////////////////////////////////////////////////////

/**
 * BLE API call: startScan
 */
- (void) startScan: (CDVInvokedUrlCommand*)command
{
	// Save callbackId.
	self.scanCallbackId = command.callbackId;

	// Tell JS side to keep the callback function
	// after startScan has finished.
	// TODO: This should not be needed. Commented out for now.
	//[self returnNoResultKeepCallback: self.scanCallbackId];

	// Start scanning.
	[self scanForPeripherals];
}

/**
 * BLE API call: stopScan
 */
- (void) stopScan: (CDVInvokedUrlCommand*)command
{
	[self.central stopScan];

	// Clear callback on the JS side.
	[self returnNoResultClearCallback: self.scanCallbackId];

	self.scanCallbackId = nil;
}

/**
 * BLE API call: connect
 */
- (void) connect: (CDVInvokedUrlCommand*)command
{
	// The connect address is in the first argument.
	NSString* address = [command.arguments objectAtIndex: 0];

	// Check that address was given.
	if (nil == address)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"connect: no device address given"
			forCallback: command.callbackId];
		return;
	}

	// Get the pheripheral object for the given address.
	NSUUID* uuid = [[NSUUID UUID] initWithUUIDString: address];
	NSArray* pheriperals = [self.central
		retrievePeripheralsWithIdentifiers: @[uuid]];

	if ([pheriperals count] < 1)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"connect: device with given address not found"
			forCallback: command.callbackId];
		return;
	}

	// Get first found pheriperal.
	CBPeripheral* peripheral = pheriperals[0];

	// TODO: Remove line.
	//CBPeripheral* peripheral = self.peripherals[address];

	if (nil == peripheral)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"connect: device not found"
			forCallback: command.callbackId];
		return;
	}

	// Save callbackId.
	self.connectCallbackId = command.callbackId;

	// Save periperal.
	[self.peripherals setObject: peripheral forKey: address];
	peripheral.delegate = self;

	// Connect. Result is given in methods:
	//   centralManager:didConnectPeripheral:
	//   centralManager:didDisconnectPeripheral:error:
	[self.central
		connectPeripheral: peripheral
		options: nil];

	// Send connecting state to JS side.
	[self
		returnConnectionState: @1 // STATE_CONNECTING
		forPeriperhal: peripheral];
}

/**
 * BLE API call: close
 */
- (void) close: (CDVInvokedUrlCommand*)command
{
	// The device handle is in the first argument.
	NSString* deviceId = [command.arguments objectAtIndex: 0];

	// Check that device handle was given.
	if (nil == deviceId)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"disconnect: no device given"
			forCallback: command.callbackId];
		return;
	}

	// Get stored pheriperal.
	CBPeripheral* peripheral = self.peripherals[deviceId];

	if (nil == peripheral)
	{
		// Pass back error message.
		[self
			returnErrorMessage: @"disconnect: device not found"
			forCallback: command.callbackId];
		return;
	}

	// Disconnect. Result is given in method:
	//   centralManager:didDisconnectPeripheral:error:
	[self.central cancelPeripheralConnection: peripheral];

	// Send disconnecting state to JS side.
	[self
		returnConnectionState: @3 // STATE_DISCONNECTING
		forPeriperhal: peripheral];
}

/**
 * BLE API call: rssi
 */
- (void) rssi: (CDVInvokedUrlCommand*)command
{
	NSString* deviceId = [command.arguments objectAtIndex: 0];
	if (nil == deviceId)
	{
		[self
			returnErrorMessage: @"disconnect: no device given"
			forCallback: command.callbackId];
		return;
	}

	CBPeripheral* peripheral = self.peripherals[deviceId];
	if (nil == peripheral)
	{
		[self
			returnErrorMessage: @"rssi: device not found"
			forCallback: command.callbackId];
		return;
	}

	// Read RSSI. Result is given in callback method:
	//   peripheralDidUpdateRSSI:error:
	[peripheral readRSSI];

	// Save callbackId.
	self.rssiCallbackId = command.callbackId;
}

/**
 * BLE API call: services
 */
- (void) services: (CDVInvokedUrlCommand*)command
{
	NSString* deviceId = [command.arguments objectAtIndex: 0];
	if (nil == deviceId)
	{
		[self
			returnErrorMessage: @"services: no device given"
			forCallback: command.callbackId];
		return;
	}

	CBPeripheral* peripheral = self.peripherals[deviceId];
	if (nil == peripheral)
	{
		[self
			returnErrorMessage: @"services: device not found"
			forCallback: command.callbackId];
		return;
	}

	// Read services. Result is given in callback method:
	//   peripheral:didDiscoverServices:
	[peripheral discoverServices: nil];

	// Save callbackId.
	self.servicesCallbackId = command.callbackId;
}

/****************************************************************/
/*               Implemented Interface Methods                  */
/****************************************************************/

/**
 * From interface CDVPlugin.
 * Called when plugin is initialized by Cordova.
 */
- (void) pluginInitialize
{
	self.scanIsWaiting = NO;

	self.central = [[CBCentralManager alloc]
		initWithDelegate: self
		queue: nil];

	self.peripherals = [NSMutableDictionary dictionary];
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when a device is discovered.
 */
- (void) centralManager: (CBCentralManager *)central
	didDiscoverPeripheral: (CBPeripheral *)peripheral
	advertisementData: (NSDictionary *)advertisementData
	RSSI: (NSNumber *)RSSI

{
	[self
		returnScanInfoForPeriperhal: peripheral
		RSSI: RSSI];

	// TODO: Remove log print when plugin is complete.
	// NSLog(@"Received periferal :%@",peripheral);
	// NSLog(@"Ad data :%@",advertisementData);

/* 	This is what you get if you print peripheral and advertisementData:
	TODO: Remove this when plugin is complete.

	2014-01-21 18:48:20.441 EvoThings[329:60b] Received periferal :<CBPeripheral: 0x14d9e450 identifier = DD9B2ED5-01B4-8795-0040-B87F3F197C72, Name = "n73", state = disconnected>

	2014-01-21 18:48:20.444 EvoThings[329:60b] Ad data :{
		kCBAdvDataChannel = 38;
		kCBAdvDataIsConnectable = 1;
		kCBAdvDataLocalName = n73;
		kCBAdvDataServiceUUIDs =     (
				"Unknown (<bec26202 a8d84a94 80fc9ac1 de37daa6>)"
		);
		kCBAdvDataTxPowerLevel = 0;
}
*/
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when the central manager changes state.
 */
- (void) centralManagerDidUpdateState: (CBCentralManager *)central
{
	NSLog(@"centralManagerDidUpdateState");

	// Start scan if we have a waiting scan that failed because
	// of the Central Manager not being on.
	if (central.state == CBCentralManagerStatePoweredOn
		&& self.scanIsWaiting)
	{
		[self scanForPeripherals];
	}
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when a device is connected.
 */
- (void) centralManager: (CBCentralManager *)central
	didConnectPeripheral: (CBPeripheral *)peripheral
{
	[self
		returnConnectionState: @2 // STATE_CONNECTED
		forPeriperhal: peripheral];
}

/**
 * From interface CBCentralManagerDelegate.
 * Called when a device is disconnected.
 */
- (void) centralManager: (CBCentralManager *)central
	didDisconnectPeripheral: (CBPeripheral *)peripheral
	error: (NSError *)error
{
	[self
		returnConnectionState: @0 // STATE_DISCONNECTED
		forPeriperhal: peripheral];

	// Clear callback on the JS side.
	[self returnNoResultClearCallback: self.connectCallbackId];

	[self.peripherals removeObjectForKey: [peripheral.identifier UUIDString]];

	self.connectCallbackId = nil;
}

/**
 * From interface CBPeripheralDelegate.
 * Called when RSSI value has been read from device.
 */
- (void) peripheralDidUpdateRSSI: (CBPeripheral *)peripheral
	error: (NSError *)error
{
	if (nil == error)
	{
		// Success. Send back data to JS.
		CDVPluginResult* result = [CDVPluginResult
			resultWithStatus: CDVCommandStatus_OK
			messageAsInt: [peripheral.RSSI intValue]];
		[self.commandDelegate
			sendPluginResult: result
			callbackId: self.rssiCallbackId];
	}
	else
	{
		// Error.
		[self
			returnErrorMessage: [error localizedDescription]
			forCallback: self.rssiCallbackId];
	}

	self.rssiCallbackId = nil;
}

/**
 * TODO: Finish the implementation, send back services to JS.
 * From interface CBPeripheralDelegate.
 * Called when services have been read from device.
 */
- (void) peripheral: (CBPeripheral *)peripheral
	didDiscoverServices: (NSError *)error
{
	if (nil == error)
	{
		NSLog(@"found services: %@", peripheral.services);

		// Success.
		// TODO: Send back data to JS.
		/*CDVPluginResult* result = [CDVPluginResult
			resultWithStatus: CDVCommandStatus_OK
			messageAsInt: [peripheral.RSSI intValue]];
		[self.commandDelegate
			sendPluginResult: result
			callbackId: self.rssiCallbackId];*/
	}
	else
	{
		// Error.
		[self
			returnErrorMessage: [error localizedDescription]
			forCallback: self.servicesCallbackId];
	}

	self.servicesCallbackId = nil;
}

/****************************************************************/
/*                      Internal Methods                        */
/****************************************************************/

/**
 * Internal helper method.
 */
- (int) scanForPeripherals
{
	if (self.central.state != CBCentralManagerStatePoweredOn)
	{
		//NSLog(@"scanForPeripherals failed: BLE is off");
		self.scanIsWaiting = YES;
		return -1;
	}

	self.scanIsWaiting = NO;

	[self.central
		scanForPeripheralsWithServices: nil
		options: nil];

	return 0;
}

/**
 * Internal helper method.
 */
- (void) returnScanInfoForPeriperhal: (CBPeripheral *)peripheral
	RSSI: (NSNumber *)RSSI
{
	// Create an info object.
	// The UUID is used as the address of the device (the 6-byte BLE address
	// does not seem to be directly available on iOS).
	NSDictionary* info = @{
		@"address" : [peripheral.identifier UUIDString],
		@"rssi" : RSSI,
		@"name" : peripheral.name,
		@"scanRecord" : @""
	};

	// Send back data to JS.
	[self
		returnDictionaryKeepCallback: info
		forCallback: self.scanCallbackId];
}

/**
 * Internal helper method.
 */
- (void) returnConnectionState: (NSNumber *)state
	forPeriperhal: (CBPeripheral *)peripheral
{
	// Create an info object.
	// The UUID is used as the address of the device (the 6-byte BLE address
	// does not seem to be directly available on iOS).
	NSDictionary* info = @{
		@"device" : [peripheral.identifier UUIDString],
		@"state" : state
	};

	// Send back data to JS.
	[self
		returnDictionaryKeepCallback: info
		forCallback: self.connectCallbackId];
}

/**
 * Internal helper method.
 * This method is useful for telling Cordova to keep the
 * callback function when the result will be returned later.
 * Not sure if this is structly required, likely Cordova
 * does not deallocate the callback until it is invoked.
 */
- (void) returnNoResultKeepCallback: (NSString*)callbackId
{
	// Tell JS side to keep the callback function.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_NO_RESULT];
	[result setKeepCallbackAsBool: YES];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Internal helper method.
 * Telling Cordova to clear the callback function associated
 * with the given callback id.
 */
- (void) returnNoResultClearCallback: (NSString*)callbackId
{
	// Clear callback on the JS side.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_NO_RESULT];
	[result setKeepCallbackAsBool: NO];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Internal helper method.
 * Send back an error message to Cordova.
 */
- (void) returnErrorMessage: (NSString*)errorMessage
	forCallback: (NSString*)callbackId
{
	// Pass back error message.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_ERROR
		messageAsString: errorMessage];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

/**
 * Internal helper method.
 * Send back a dictionary object to Cordova.
 */
- (void) returnDictionaryKeepCallback: (NSDictionary*)dictionary
	forCallback: (NSString*)callbackId
{
	// Send back data to JS.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_OK
		messageAsDictionary: dictionary];
	[result setKeepCallbackAsBool: YES];
	[self.commandDelegate
		sendPluginResult: result
		callbackId: callbackId];
}

@end

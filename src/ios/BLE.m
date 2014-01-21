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

- (void)startScan: (CDVInvokedUrlCommand*)command
{
	// Save callbackId.
	self.callbackId = command.callbackId;

	// Tell JS side to keep the callback function
	// after startScan has finished.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_NO_RESULT];
    [result setKeepCallbackAsBool: YES];
    [self.commandDelegate
		sendPluginResult: result
		callbackId: self.callbackId];

	// Start scanning.
	[self scanForPeripherals];
}

- (void)stopScan: (CDVInvokedUrlCommand*)command
{
	[self.central stopScan];

	// Clear callback on the JS side.
	CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_NO_RESULT];
    [result setKeepCallbackAsBool: NO];
    [self.commandDelegate
		sendPluginResult: result
		callbackId: self.callbackId];

	self.callbackId = nil;
}

- (void) pluginInitialize
{
    NSLog(@"pluginInitialize");

	self.scanIsWaiting = NO;

	self.central = [[CBCentralManager alloc]
		initWithDelegate: self
		queue: nil];
}

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

- (void) centralManagerDidUpdateState: (CBCentralManager *)central
{
	NSLog(@"@@@ centralManagerDidUpdateState");

	// Start scan if we have a waiting scan that failed because
	// of the Central Manager not being on.
	if (central.state == CBCentralManagerStatePoweredOn
		&& self.scanIsWaiting)
	{
		[self scanForPeripherals];
	}
}

- (void) returnScanInfoForPeriperhal: (CBPeripheral *)peripheral RSSI: (NSNumber *)RSSI
{
    // Create an info object.
    NSMutableDictionary* info = [NSMutableDictionary dictionaryWithCapacity:4];

	// TODO: Investigate if the UUID contains the physical 6-byte address
	// of the device. Then convert it to the format specified by the API.
	// The UUID will likely need to be kept for use with iOS BLE functions.
    [info setValue: [peripheral.identifier UUIDString] forKey: @"address"];
    [info setValue: RSSI forKey: @"rssi"];
    [info setValue: peripheral.name forKey: @"name"];
    [info setValue: @"" forKey: @"scanRecord"];

	// Send back data to JS.
    CDVPluginResult* result = [CDVPluginResult
		resultWithStatus: CDVCommandStatus_OK
		messageAsDictionary: info];
    [result setKeepCallbackAsBool: YES];
    [self.commandDelegate
		sendPluginResult: result
		callbackId: self.callbackId];
}

@end

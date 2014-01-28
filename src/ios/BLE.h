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

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <CoreBluetooth/CBService.h>
#import <Cordova/CDVPlugin.h>

//////////////////////////////////////////////////////////////////
//                          Class BLE                           //
//////////////////////////////////////////////////////////////////

@interface BLE : CDVPlugin <CBCentralManagerDelegate>

/* TODO: Should (strong, nonatomic) be used? Like this:
@property (strong, nonatomic) NSString* callbackId;
@property (strong, nonatomic) CBCentralManager* central;
@property (strong, nonatomic) CBPeripheral* activePeripheral;
@property (assign, nonatomic) BOOL scanIsWaiting;
*/

@property int handleCounter;
@property CBCentralManager* central;
@property NSMutableDictionary* peripherals;
@property BOOL scanIsWaiting;
@property NSString* scanCallbackId;

// Public Cordova API.
- (void) startScan: (CDVInvokedUrlCommand*)command;
- (void) stopScan: (CDVInvokedUrlCommand*)command;
- (void) connect: (CDVInvokedUrlCommand*)command;
- (void) close: (CDVInvokedUrlCommand*)command;
- (void) rssi: (CDVInvokedUrlCommand*)command;
- (void) services: (CDVInvokedUrlCommand*)command;
- (void) characteristics: (CDVInvokedUrlCommand*)command;
- (void) descriptors: (CDVInvokedUrlCommand*)command;
- (void) readCharacteristic: (CDVInvokedUrlCommand*)command;
- (void) readDescriptor: (CDVInvokedUrlCommand*)command;
- (void) writeCharacteristic: (CDVInvokedUrlCommand*)command;
- (void) writeDescriptor: (CDVInvokedUrlCommand*)command;
- (void) enableNotification: (CDVInvokedUrlCommand*)command;
- (void) disableNotification: (CDVInvokedUrlCommand*)command;
- (void) reset: (CDVInvokedUrlCommand*)command;

// Internal API.
- (NSNumber*) nextHandle;
- (void) returnNoResultClearCallback: (NSString*)callbackId;
- (void) returnErrorMessage: (NSString*)errorMessage
	forCallback: (NSString*)callbackId;
- (void) returnDictionary: (NSDictionary*)dictionary
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) returnArray: (NSArray*)array
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) returnInt: (int)value
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;

@end

//////////////////////////////////////////////////////////////////
//                     Class MyPeriperal                        //
//////////////////////////////////////////////////////////////////

@interface MyPeripheral : NSObject <CBPeripheralDelegate>

@property NSNumber* handle;
@property CBPeripheral* peripheral;
@property BLE* ble;
@property NSMutableDictionary* objects;
/*@property NSString* connectCallbackId;
@property NSString* rssiCallbackId;
@property NSString* servicesCallbackId;
@property NSString* characteristicsCallbackId;
@property NSString* descriptorsCallbackId;*/


+ (MyPeripheral*) withBLE: (BLE*) ble periperal: (CBPeripheral*) peripheral;

- (MyPeripheral*) init;
- (void) addObject: (id)obj withHandle: (id)handle;
- (id) getObjectWithHandle: (id)handle;
- (void) removeObjectWithHandle: (id)handle;
- (void) addCallbackId: (id)callbackId
	withSignature: (NSString*)signature forObject: (id)obj;
- (id) getCallbackIdWithSignature: (NSString*)signature forObject: (id)obj;
- (void) clearCallbackIdWithSignature: (NSString*)signature forObject: (id)obj;

@end

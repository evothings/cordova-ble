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
//                      Class MyQueue                           //
//////////////////////////////////////////////////////////////////

@interface MyQueue : NSObject

@property NSMutableArray* array;

- (MyQueue*) init;
- (void) enqueue: (id)item;
- (id) dequeue;
- (id) first;
- (BOOL) isEmpty;

@end

//////////////////////////////////////////////////////////////////
//                     Class MyCommand                          //
//////////////////////////////////////////////////////////////////

typedef void (^MyCommandBlock)(void);

@interface MyCommand : NSObject

@property NSString* callbackId;
@property (strong, nonatomic) MyCommandBlock block;
//@property int type; // COMMAND_SERVICES, COMMAND_CHARACTERISTICS,...

- (MyCommand*) init;
- (void) doBlock;

@end

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

// Instance methods.
- (NSNumber*) nextHandle;
- (void) sendNoResultClearCallback: (NSString*)callbackId;
- (void) sendErrorMessage: (NSString*)errorMessage
	forCallback: (NSString*)callbackId;
- (void) sendDictionary: (NSDictionary*)dictionary
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) sendArray: (NSArray*)array
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) sendInt: (int)value
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;
- (void) sendBuffer: (NSData*)buffer
	forCallback: (NSString*)callbackId
	keepCallback: (BOOL) keep;

@end

//////////////////////////////////////////////////////////////////
//                   Class MyCallbackInfo                       //
//////////////////////////////////////////////////////////////////

@interface MyCallbackInfo : NSObject

@property NSString* callbackId;
@property BOOL isNotifyingCallback;

@end

//////////////////////////////////////////////////////////////////
//                     Class MyPeriperal                        //
//////////////////////////////////////////////////////////////////

@interface MyPeripheral : NSObject <CBPeripheralDelegate>

@property NSNumber* handle;
@property CBPeripheral* peripheral;
@property BLE* ble;
@property NSMutableDictionary* objects; // Handle to object table
@property NSString* connectCallbackId;
@property MyQueue* commands; // Contains MyCommand objects
@property NSMutableDictionary* characteristicsCallbacks; // Contains MyCallbackInfo objects

+ (MyPeripheral*) withBLE: (BLE*) ble periperal: (CBPeripheral*) peripheral;

- (MyPeripheral*) init;
- (void) addObject: (id)obj withHandle: (id)handle;
- (id) getObjectWithHandle: (id)handle;
- (void) removeObjectWithHandle: (id)handle;
- (void) addCommandForCallbackId: (NSString*)callbackId withBlock: (MyCommandBlock)block;
- (NSString*) getActiveCallbackId;
- (void) clearActiveCommand;
- (void) addCallbackForCharacteristic: (CBCharacteristic*)characteristic
	callbackId: (NSString*)callbackId
	isNotifyingCallback: (BOOL) notify;

@end

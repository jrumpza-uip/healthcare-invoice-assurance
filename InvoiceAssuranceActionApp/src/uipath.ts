import { CodedActionAppService } from '@uipath/coded-action-app';
import { Buckets } from '@uipath/uipath-typescript/buckets';
import { UiPath } from '@uipath/uipath-typescript/core';
import { Entities } from '@uipath/uipath-typescript/entities';

// Action Center injects the authenticated host session. Never call initialize().
export const codedActionAppService = new CodedActionAppService();

let sdk: UiPath | undefined;
let buckets: Buckets | undefined;
let entities: Entities | undefined;

function getSdk(): UiPath {
  sdk ??= new UiPath();
  return sdk;
}

export function getBuckets(): Buckets {
  buckets ??= new Buckets(getSdk());
  return buckets;
}

export function getEntities(): Entities {
  entities ??= new Entities(getSdk());
  return entities;
}

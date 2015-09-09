export default class StateUpdateFilter {
  constructor() {
    this.fieldTimestamps = {};

    this.stagedUpdate = null;
  }

  /**
   * Filters out fields that were updated in the past and are stale now
   * Automatically stages the state update so that the next call to process outgoing results in that update being processed in the context of this one
   * @returns {Object} - {update: processed update, metadata: processed metadata}
   */
  processIncomingStateUpdate(update, metadata) {
    const updateTimestamp = metadata.originalTimestamp || metadata.timestamp;

    const filteredUpdate = {};
    for (let name of StateUpdateFilter.walkValueFieldNames(update)) {
      const fieldTimestamp = this.fieldTimestamps[name];
      // If the update is more recent than the recorded timestamp
      if (!fieldTimestamp || updateTimestamp > fieldTimestamp ) {
        StateUpdateFilter.copyField(update, filteredUpdate, name);
      }
    }

    this.stageUpdate(filteredUpdate, metadata);
    return {update: filteredUpdate, metadata: metadata};
  }

  /**
   * Records that the updated fields have changed
   * If there is a staged state update, modifies metadata to specify that this is in response to that
   * Clears any update that was previously staged since staged updates are only good for a single outgoing state update
   * @returns {Object} - {update: processed update, metadata: processed metadata}
   */
  processOutgoingStateUpdate(update, metadata) {
    let changeTimestamp = metadata.timestamp || Date.now();
    if (this.stagedUpdate && StateUpdateFilter.objectsEqual(update, this.stagedUpdate.update)) {

      changeTimestamp = this.stagedUpdate.metadata.timestamp;
      metadata.originalTimestamp = changeTimestamp;

      this.clearStagedUpdate();
    }

    for (let name of StateUpdateFilter.walkValueFieldNames(update)) {
      this.fieldTimestamps[name] = changeTimestamp;
    }

    return {update: update, metadata: metadata};
  }

  /**
   * Stores an update (usually an incoming update) so that the next outgoing
   * update will be processed in the context of this one
   */
  stageUpdate(update, metadata) {
    // Clone the objects
    update = JSON.parse(JSON.stringify(update));
    metadata = JSON.parse(JSON.stringify(metadata));
    this.stagedUpdate = {update: update, metadata: metadata};
  }

  /**
   * Clears the currently staged update
   * @returns {Object} Returns the update that was staged
   */
  clearStagedUpdate() {
    const stagedUpdate = this.stagedUpdate;
    this.stagedUpdate = null;
    return stagedUpdate;
  }

  /**
   * Yields the dotted names of the fields of the object that do NOT contain
   * other objects
   * In other words, does a depth first walk of the given object yield names like "a.b.c" for the field containing 1 in {a: {b: {c: 1}}}
   */
  static *walkValueFieldNames(object) {
    for (let [name, value] of StateUpdateFilter.walkValueFields(object)) {
      yield name;
    }
  }

  static *walkValueFields(object) {
    for (let name of Object.keys(object)) {
      const value = object[name];
      if (typeof value === 'object' && value.constructor === Object) {
        for (let [childName, childValue] of StateUpdateFilter.walkValueFields(value)) {
          yield [`${name}.${childName}`, childValue];
        }
      }
      else {
        yield [name, value];
      }
    }
  }

  /**
   * Deeply compares two javascript objects for equality
   * @param {Object} object1 - The first object
   * @param {Object} object2 - The object to compare against
   * @returns {Boolean} whether the objects are equal or not
   */
  static objectsEqual(object1, object2) {
    const object1Fields = Array.from(StateUpdateFilter.walkValueFields(object1));
    const object2Fields = Array.from(StateUpdateFilter.walkValueFields(object2));

    if (object1Fields.length !== object2Fields.length) {
      return false;
    }

    const object2FieldMap = new Map(object2Fields);
    for (let [key, value] of object1Fields) {
      if (!object2FieldMap.has(key) || object2FieldMap.get(key) !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Copies a dot-delimited name from source to destination
   */
  static copyField(source, destination, name) {
    const parentNames = name.split(".");
    const fieldName = parentNames.pop();
    let sourceParent = source;
    let destinationParent = destination;
    for (let parentName of parentNames) {
      if (!sourceParent.hasOwnProperty(parentName)) {
        return;
      }
      sourceParent = sourceParent[parentName];
      if (!destinationParent.hasOwnProperty(parentName)) {
        destinationParent[parentName] = {};
      }
      destinationParent = destinationParent[parentName];
    }
    destinationParent[fieldName] = sourceParent[fieldName];
  }
}

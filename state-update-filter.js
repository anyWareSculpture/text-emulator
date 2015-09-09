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

    for (let name of StateUpdateFilter.walkValueFieldNames(update)) {
      const fieldTimestamp = this.fieldTimestamps[name];
      // If the field is more or just as up to date than this update
      if (fieldTimestamp >= updateTimestamp) {
        StateUpdateFilter.removeField(update, name);
      }
    }

    this.stageUpdate(update, metadata);
    return {update: update, metadata: metadata};
  }

  /**
   * Records that the updated fields have changed or if there is a staged state update, modifies metadata to specify that this is in response to that
   * Clears any update that was previously staged since staged updates are only good for a single outgoing state update
   * @returns {Object} - {update: processed update, metadata: processed metadata}
   */
  processOutgoingStateUpdate(update, metadata) {
    if (this.stagedUpdate) {
      console.log(update);
      console.log(this.stagedUpdate.update);
    }
    if (this.stagedUpdate && StateUpdateFilter.objectsEqual(update, this.stagedUpdate.update)) {
      metadata.originalTimestamp = this.stagedUpdate.metadata.timestamp;
      console.log('added original timestamp');

      this.clearStagedUpdate();
    }
    else {
      const currentTimestamp = Date.now();
      for (let name of StateUpdateFilter.walkValueFieldNames(update)) {
        this.fieldTimestamps[name] = currentTimestamp;
      }
    }
    return {update: update, metadata: metadata};
  }

  /**
   * Stores an update (usually an incoming update) so that the next outgoing
   * update will be processed in the context of this one
   */
  stageUpdate(update, metadata) {
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
        for (let childName of StateUpdateFilter.walkValueFields(value)) {
          yield [`${name}.${childName}`, value];
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
   * Removes the given field name from the object
   * @param {Object} object - the object to modify
   * @param {String} fullFieldName - the dot-delimited field name - each dot represents another layer of depth into the object (i.e. a.b.c => a["b"]["c"])
   */
  static removeField(object, fullFieldName) {
    const parentNames = fullFieldName.split(".");
    const fieldName = parentNames.pop();
    let parent = object;
    for (let name of parentNames) {
      parent = parent[name];
    }
    delete parent[fieldName];
  }
}

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
    const filteredUpdate = {};
    //TODO

    this.stageUpdate(update, metadata);
    return {update: filteredUpdate, metadata: metadata};
  }

  /**
   * Records that the updated fields have changed or if there is a staged state update, modifies metadata to specify that this is in response to that
   * Clears any update that was previously staged since staged updates are only good for a single outgoing state update
   * @returns {Object} - {update: processed update, metadata: processed metadata}
   */
  processOutgoingStateUpdate(update, metadata=null) {
    if (this.stagedUpdate) {
      //TODO
      this.clearStagedUpdate();
    }
    else {
      const currentTimestamp = Date.now();
      for (let name of StateUpdateFilter.walkValueFields(update)) {
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
  static *walkValueFields(object) {
    for (let name of Object.keys(object)) {
      const value = object[name];
      if (typeof value === 'object' && value.constructor === Object) {
        for (let childName of StateUpdateFilter.walkValueFields(value)) {
          yield `${name}.${childName}`;
        }
      }
      else {
        yield name;
      }
    }
  }
}

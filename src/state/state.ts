export type StateListener<T> = (state: T) => void;

/**
 * Creates a new State object with the specified value.
 *
 * @template T value - The value of the State object.
 *
 * @returns {State<T>} - A new State object with the specified value.
 */
export function state<T>(value: T): State<T> {
    return new State(value);
}

/**
 * Creates a new mapped state by applying a mapping function to the value of an existing state.
 *
 * @param {State} state - The existing state to map
 * @param fn - The mapping function to apply to the value of the state
 * @returns {State} A new state with the mapped value
 */
export function mapped_state<T, R>(state: State<R>, fn: (value: R) => T): State<T> {
    return new MappedState(state, fn);
}

/**
 * Represents a state object that holds a value and allows for listening and updating the value.
 * @template T - The type of value held by the state object.
 */
export class State<T> {

    private value: T;
    private listeners: Set<StateListener<T>> = new Set();

    constructor(value: T) {
        this.value = value;
    }

    /**
     * Retrieves the value of the current object.
     *
     * @return The value of the current object
     */
    public get(): T {
        return this.value;
    }

    /**
     * Sets the value of the object.
     *
     * @param value - The value to be set
     * @return {void}
     */
    public set(value: T): void {
        this.value = value;
        for (let listener of this.listeners) {
            listener(this.value);
        }
    }

    /**
     * Adds a StateListener to the listeners set and returns a function to remove it.
     *
     * @param {StateListener} listener - The listener to bind
     * @returns {Function} - A function that, when called, removes the listener from the listeners set
     */
    public bind(listener: StateListener<T>): () => void {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        }
    }

}

/**
 * Represents a mapped state that transforms the value of the source state using a provided function.
 *
 * @template T The type of the mapped state value
 * @template S The type of the source state value
 */
export class MappedState<T, S> extends State<T> {

    private unbind_fn: (() => void) | undefined;

    constructor(state: State<S>, fn: (value: S) => T) {
        super(fn(state.get()));

        this.unbind_fn = state.bind((value: S): void => {
            this.set(fn(value));
        });
    }

    /**
     * Unbinds the mapped state from the source state.
     *
     * @returns {void}
     */
    public unbind(): void {
        if (this.unbind_fn === undefined) {
            return;
        }

        this.unbind_fn();
        this.unbind_fn = undefined;
    }

}
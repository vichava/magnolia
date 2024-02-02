export type StateListener<T> = (state: T) => void;
export type EqualityFunction<T> = (a: T, b: T) => boolean;

/**
 * Creates a new State object with the specified value.
 *
 * @template T value - The value of the State object.
 * @param {T} value - The value of the State object.
 * @param {EqualityFunction} equals - An optional equality function to use when comparing the value.
 *
 * @returns {State<T>} - A new State object with the specified value.
 */
export function state<T>(
    value: T,
    equals?: EqualityFunction<T>
): State<T> {
    return new State(value, equals);
}

/**
 * Creates a new mapped state by applying a mapping function to the value of an existing state.
 *
 * @param {State} state - The existing state to map
 * @param fn - The mapping function to apply to the value of the state
 * @param equals - An optional equality function to use when comparing the mapped value
 * @returns {State} A new state with the mapped value
 */
export function map<T, R>(
    state: State<R>,
    fn: (value: R) => T,
    equals?: EqualityFunction<T>
): State<T> {
    return new MappedState(state, fn, equals);
}

/**
 * Represents a state object that holds a value and allows for listening and updating the value.
 * @template T - The type of value held by the state object.
 */
export class State<V> {

    private value: V;
    protected equals: EqualityFunction<V> | undefined = undefined;
    private listeners: Set<StateListener<V>> = new Set();

    constructor(
        value: V,
        equals?: EqualityFunction<V>
    ) {
        this.value = value;
        this.equals = equals;
    }

    /**
     * Retrieves the value of the current object.
     *
     * @return The value of the current object
     */
    public get(): V {
        return this.value;
    }

    /**
     * Sets the value of the object.
     *
     * @param value - The value to be set
     * @return {void}
     */
    public set(value: V): void {
        let updated: boolean = this.equals === undefined ? true : !this.equals(this.value, value);

        if (!updated) {
            return;
        }

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
    public bind(listener: StateListener<V>): () => void {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        }
    }

    public map<M>(fn: (value: V) => M): MappedState<M, V> {
        return new MappedState(this, fn);
    }

}

/**
 * Represents a mapped state that transforms the value of the source state using a provided function.
 *
 * @template T The type of the mapped state value
 * @template S The type of the source state value
 */
export class MappedState<M, V> extends State<M> {

    private unbind_fn: (() => void) | undefined;

    constructor(
        state: State<V>,
        fn: (value: V) => M,
        equals?: EqualityFunction<M>
    ) {
        super(fn(state.get()));

        this.unbind_fn = state.bind((value: V): void => {
            this.set(fn(value));
        });

        this.equals = equals;
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

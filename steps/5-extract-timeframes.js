import Module from '../build/output.mjs';

export class ExtractTimeframesStep{
    constructor(globals, parent, event_name, event_output_name){
        this.globals = globals
        this.parent = parent
        this.event_name = event_name
        this.event_output_name = event_output_name
        this.module = globals.module
        this.listeners = []
    }
    registerListener(listener){
        this.listeners.push(listener)
    }
    async callback(event){
        if(event.event == "files-processed"){
            this.files = event.data
        }
        if(event.event == this.event_name){
            this.ranges = event.data
        }
        if(this.files && this.ranges){
            const m = await this.module;
            const flights = new m.MultipleFlights()
            for(const flight of this.files.flights){
                flights.add_flight(flight)
            }
            const flights_ranges = m.extract_timeframes(flights, this.ranges)
            const flights_sliced_and_interpolated = m.slice_gaps_and_interpolate(flights_ranges)

            for(const listener of this.listeners){
                listener.callback({"event": this.event_output_name, "data": flights_sliced_and_interpolated})
            }
        }
        else{
            console.log(`ExtractTimeframesStep: got event ${event.event} but not ready to process files yet. Files: ${this.files}, ranges: ${this.ranges}`)
        }
    }
}
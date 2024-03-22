import {getExcitationMetrics} from '../excitation_metrics.js';

export class FileProcessingStep{
    constructor(globals, parent){
        this.globals = globals
        this.parent = parent
        this.listeners = []
        this.module = globals.module
        this.files = null
        this.actuator_motors_topic = null
        this.model = null
    }

    registerListener(listener){
        this.listeners.push(listener)
    }

    async callback(event){
        if(event.event == "files"){
            this.files = event.data.files
            this.actuator_motors_topic = event.data.actuator_motors_topic
        }
        if(event.event == "model"){
            this.model = event.data
        }
        if(this.files && this.model){
            const names = []
            const flights = []
            const flight_data = []
            const excitation_metrics = []
            const m = await this.module;
            for(var log_file_i=0; log_file_i < this.files.length; log_file_i++){
                for(const listener of this.listeners){
                    listener.callback({"event": "file-processing-progress", "data": {current: log_file_i, current_name: this.files[log_file_i].name, total: this.files.length}})
                }
                await new Promise(r => setTimeout(r, 100));
                const log_file = this.files[log_file_i].data;
                const log_file_path = this.files[log_file_i].name;
                names.push(log_file_path)
                console.log("Reading log file")
                const log_file_data_source = m.load_ulog(log_file, log_file_path);
                console.log("Finished reading log file")
                const flight = new m.Flight();
                flights.push(flight)
                m.read_flight(log_file_data_source, flight, this.actuator_motors_topic);
                const current_flight_data = m.get_flight_data(flight);

                flight_data.push(current_flight_data)
                const current_excitation_metrics = getExcitationMetrics(this.model, current_flight_data);
                excitation_metrics.push(current_excitation_metrics)

            }
            for(const listener of this.listeners){
                listener.callback({"event": "files-processed", "data": {names, flights, flight_data, excitation_metrics}})
            }
        }
        else{
            console.log(`ProcessingFilesStep: got event ${event.event} but not ready to process files yet. Files: ${this.files}, model: ${this.model}`)
        }

    }
}
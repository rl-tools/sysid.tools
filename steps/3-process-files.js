import {getExcitationMetrics} from '../excitation_metrics.js';

export class FileProcessingStep{
    constructor(globals, parent, motor_command_topic){
        this.globals = globals
        this.parent = parent
        this.motor_command_topic = motor_command_topic
        this.listeners = []
        this.module = globals.module
    }

    registerListener(listener){
        this.listeners.push(listener)
    }

    async callback(event){
        if(event.event == "files"){
            this.files = event.data
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
            for(var log_file_i=0; log_file_i < event.data.length; log_file_i++){
                for(const listener of this.listeners){
                    listener.callback({"event": "file-processing-progress", "data": {current: log_file_i, current_name: event.data[log_file_i].name, total: event.data.length}})
                }
                await new Promise(r => setTimeout(r, 100));
                const log_file = event.data[log_file_i].data;
                const log_file_path = event.data[log_file_i].name;
                names.push(log_file_path)
                console.log("Reading log file")
                const log_file_data_source = m.load_ulog(log_file, log_file_path);
                console.log("Finished reading log file")
                const flight = new m.Flight();
                flights.push(flight)
                m.read_flight(log_file_data_source, flight, this.motor_command_topic);
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
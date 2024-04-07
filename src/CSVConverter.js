import React from 'react';

class CSVConverter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      convertedData: []
    };
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const csvData = reader.result;
      const convertedData = this.convertCSVtoJSON(csvData);
      this.setState({ convertedData });
      this.props.onConvert(this.state.convertedData);
    };

    reader.readAsText(file);
  };

  convertCSVtoJSON = (csvData) => {
    const lines = csvData.split('\n');
    const result = [];

    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          if (headers[j].trim() === 'lng' || headers[j].trim() === 'lat') {
            obj[headers[j].trim()] = parseFloat(values[j]);
          }
        }
        result.push(obj);
      }
    }

    return result;
  };

  render() {
    return (
      <div>
        <input type="file" onChange={this.handleFileChange} />
      </div>
    );
  }
}

export default CSVConverter;

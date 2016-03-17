var React = require('react');
var {actions} = require('app/modules/storedSessionsFilter');
var LinkedStateMixin = require('react-addons-linked-state-mixin');
var {Table, Column, Cell, TextCell, SortHeaderCell, SortTypes} = require('app/components/table.jsx');
var {ButtonCell, SingleUserCell, EmptyList, DateCreatedCell} = require('./listItems');
var {DateRangePicker, CalendarNav} = require('./../datePicker.jsx');
var moment =  require('moment');
var {weekRange} = require('app/common/dateUtils');
var {isMatch} = require('app/common/objectUtils');
var _ = require('_');

var ArchivedSessions = React.createClass({

  mixins: [LinkedStateMixin],

  getInitialState(){
    this.searchableProps = ['serverIp', 'created', 'sid', 'login'];
    return { filter: '', colSortDirs: {created: 'ASC'}};
  },

  componentWillMount(){
    setTimeout(()=>actions.fetch(), 0);
  },

  onSortChange(columnKey, sortDir) {
    this.setState({
      ...this.state,
      colSortDirs: { [columnKey]: sortDir }
    });
  },

  onRangePickerChange({startDate, endDate}){
    actions.setTimeRange(startDate, endDate);
  },

  onCalendarNavChange(newValue){
    let [startDate, endDate] = weekRange(newValue);
    actions.setTimeRange(startDate, endDate);
  },

  searchAndFilterCb(targetValue, searchValue, propName){
    if(propName === 'created'){
      var displayDate = moment(targetValue).format('l LTS').toLocaleUpperCase();
      return displayDate.indexOf(searchValue) !== -1;
    }
  },

  sortAndFilter(data){
    var filtered = data.filter(obj=>
      isMatch(obj, this.state.filter, {
        searchableProps: this.searchableProps,
        cb: this.searchAndFilterCb
      }));

    var columnKey = Object.getOwnPropertyNames(this.state.colSortDirs)[0];
    var sortDir = this.state.colSortDirs[columnKey];
    var sorted = _.sortBy(filtered, columnKey);
    if(sortDir === SortTypes.ASC){
      sorted = sorted.reverse();
    }

    return sorted;
  },

  render: function() {
    let {start, end, status} = this.props.filter;
    let data = this.props.data.filter(
      item => !item.active && moment(item.created).isBetween(start, end));

    data = this.sortAndFilter(data);

    return (
      <div className="grv-sessions-stored">
        <div className="grv-header">
          <h1> Archived Sessions </h1>
          <div className="grv-flex">
            <div className="grv-flex-row">
              <DateRangePicker startDate={start} endDate={end} onChange={this.onRangePickerChange}/>
            </div>
            <div className="grv-flex-row">
              <CalendarNav value={end} onValueChange={this.onCalendarNavChange}/>
            </div>
            <div className="grv-flex-row">
              <div className="grv-search">
                <input valueLink={this.linkState('filter')} placeholder="Search..." className="form-control input-sm"/>
              </div>
            </div>
          </div>
        </div>

        <div className="grv-content">
          {data.length === 0 && !status.isLoading ? <EmptyList text="No matching archived sessions found."/> :
            <div className="">
              <Table rowCount={data.length} className="table-striped">
                <Column
                  columnKey="sid"
                  header={<Cell> Session ID </Cell> }
                  cell={<TextCell data={data}/> }
                />
                <Column
                  header={<Cell> </Cell> }
                  cell={
                    <ButtonCell data={data} />
                  }
                />
                <Column
                  columnKey="created"
                  header={
                    <SortHeaderCell
                      sortDir={this.state.colSortDirs.created}
                      onSortChange={this.onSortChange}
                      title="Created"
                    />
                  }
                  cell={<DateCreatedCell data={data}/> }
                />
                <Column
                  header={<Cell> User </Cell> }
                  cell={<SingleUserCell data={data}/> }
                />
              </Table>
            </div>
          }
        </div>
        {
          status.hasMore ?
            (<div className="grv-footer">
              <button disabled={status.isLoading} className="btn btn-primary btn-outline" onClick={actions.fetchMore}>
                <span>Load more...</span>
              </button>
            </div>) : null
        }
      </div>
    )
  }
});

module.exports = ArchivedSessions;
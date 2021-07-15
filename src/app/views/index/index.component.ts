import { Component, Inject, OnInit } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserModule } from '@angular/platform-browser';
import { DxListModule, DxToolbarModule, DxSelectBoxModule, DxTemplateModule } from 'devextreme-angular';

import DataSource from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { Chart } from 'admin-lte/plugins/chart.js/Chart.js'

import { ProductType, TestsService } from "../../__core/services/tests/tests.service";

@Component({
  selector: "app-index",
  templateUrl: "./index.component.html",
})
export class IndexComponent implements OnInit {
  items: any[];

  productTypes: ProductType[];

  productsStore: any;
  backButtonOptions: any;
  refreshButtonOptions: any;
  selectBoxOptions: any;
  addButtonOptions: any;
  saveButtonOptions: any;
  printButtonOptions: any;
  settingsButtonOptions: any;

  constructor(@Inject(DOCUMENT) private document: Document, service: TestsService) {
    this.productTypes = service.getProductTypes();
    this.productsStore = new DataSource(service.getProducts());

    this.backButtonOptions = {
      type: 'back',
      onClick: () => {
        notify('Back button has been clicked!');
      }
    };

    this.refreshButtonOptions = {
      icon: 'refresh',
      onClick: () => {
        notify('Refresh button has been clicked!');
      }
    };

    this.selectBoxOptions = {
      width: 140,
      items: this.productTypes,
      valueExpr: 'id',
      displayExpr: 'text',
      value: this.productTypes[0].id,
      onValueChanged: (args) => {
        if (args.value > 1) {
          this.productsStore.filter('type', '=', args.value);
        } else {
          this.productsStore.filter(null);
        }
        this.productsStore.load();
      }
    };

    this.addButtonOptions = {
      icon: 'plus',
      onClick: () => {
        notify('Add button has been clicked!');
      }
    };

    this.saveButtonOptions = {
      text: "Save",
      onClick: () => {
        notify('Save option has been clicked!');
      }
    };

    this.printButtonOptions = {
      text: "Print",
      onClick: () => {
        notify('Print option has been clicked!');
      }
    };

    this.settingsButtonOptions = {
      text: "Settings",
      onClick: () => {
        notify('Settings option has been clicked!');
      }
    };
  }

  ngOnInit(): void {

    this.document.body.classList.add('hold-transition', 'sidebar-mini', 'layout-fixed', 'layout-navbar-fixed', 'layout-footer-fixed');


    const salesChartCanvas_e: HTMLCanvasElement = document.getElementById('salesChart') as HTMLCanvasElement;
    const salesChartCanvas = salesChartCanvas_e.getContext('2d');

    const salesChartData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'Digital Goods',
          backgroundColor: 'rgba(60,141,188,0.9)',
          borderColor: 'rgba(60,141,188,0.8)',
          pointRadius: false,
          pointColor: '#3b8bba',
          pointStrokeColor: 'rgba(60,141,188,1)',
          pointHighlightFill: '#fff',
          pointHighlightStroke: 'rgba(60,141,188,1)',
          data: [28, 48, 40, 19, 86, 27, 90]
        }, {
          label: 'Electronics',
          backgroundColor: 'rgba(210, 214, 222, 1)',
          borderColor: 'rgba(210, 214, 222, 1)',
          pointRadius: false,
          pointColor: 'rgba(210, 214, 222, 1)',
          pointStrokeColor: '#c1c7d1',
          pointHighlightFill: '#fff',
          pointHighlightStroke: 'rgba(220,220,220,1)',
          data: [65, 59, 80, 81, 56, 55, 40]
        },
      ]
    }

    const salesChartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          gridLines: {
            display: false,
          }
        }],
        yAxes: [{
          gridLines: {
            display: false,
          }
        }]
      }
    }

    // This will get the first returned node in the jQuery collection.
    const salesChart = new Chart(salesChartCanvas, {
        type: 'line',
        data: salesChartData,
        options: salesChartOptions
      }
    )

    //---------------------------
    //- END MONTHLY SALES CHART -
    //---------------------------

    //-------------
    //- PIE CHART -
    //-------------
    // Get context with jQuery - using jQuery's .get() method.
    // const pieChartCanvas = (document.getElementById('pieChart') as HTMLCanvasElement).getContext('2d')
    // const pieData = {
    //   labels: [
    //     'Chrome',
    //     'IE',
    //     'FireFox',
    //     'Safari',
    //     'Opera',
    //     'Navigator',
    //   ],
    //   datasets: [
    //     {
    //       data: [700, 500, 400, 600, 300, 100],
    //       backgroundColor: ['#f56954', '#00a65a', '#f39c12', '#00c0ef', '#3c8dbc', '#d2d6de'],
    //     }
    //   ]
    // }
    // const pieOptions = {
    //   legend: {
    //     display: false
    //   }
    // }
    // //Create pie or douhnut chart
    // // You can switch between pie and douhnut using the method below.
    // const pieChart = new Chart(pieChartCanvas, {
    //   type: 'doughnut',
    //   data: pieData,
    //   options: pieOptions
    // })
    //
    //   //-----------------
    //   //- END PIE CHART -
    //   //-----------------
    //
    //   /* jVector Maps
    //    * ------------
    //    * Create a world map with markers
    //    */
    //   (document.getElementById('world-map-markers') as HTMLElement).mapael({
    //       map: {
    //         name: "usa_states",
    //         zoom: {
    //           enabled: true,
    //           maxLevel: 10
    //         },
    //       },
    //     }
    //   );
  }
}

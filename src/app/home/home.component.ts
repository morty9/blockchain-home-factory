import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../util/web3.service';
import { MatSnackBar } from '@angular/material';

declare let require: any;
const home_artifacts = require('../../../build/contracts/HomeFactory.json');

@Component({
  selector: 'app-home-component',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  accounts: string[];
  homes : Array<string> = new Array<string>();
  ownerHomes : Array<string> = new Array<string>();
  MetaCoin: any;
  HomeFactory: any;

  model = {
    account: ''
  };

  homeModel = {
    address: '',
    price: '',
    picture: '',
    owner: ''
  };

  status = '';

  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);
    this.watchAccount();
    this.web3Service.artifactsToContract(home_artifacts)
      .then((HomeAbstraction) => {
        this.HomeFactory = HomeAbstraction;
        this.getHomesByOwner();
        this.getAllHomes();
    });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.account = accounts[0];
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async createHome() {
    const deployedHomeFactory = await this.HomeFactory.deployed();
    deployedHomeFactory._createHome(this.homeModel.address, this.homeModel.price, this.homeModel.picture, {from : this.model.account}).on('receipt', (res) => {
      this.getHomesByOwner();
      this.getAllHomes();
    });

  }

  async getHomesByOwner() {
    const deployedHomeFactory = await this.HomeFactory.deployed();
    deployedHomeFactory.getHomesByOwner(this.model.account).then( (res) => {
      this.ownerHomes = new Array<string>();
      for (var i = 0; i < res.length; i++) {
        deployedHomeFactory.getHomeByIndex(res[i]).then((res)=>{
          this.ownerHomes.push(res);
        })
      }
    });
  }

  async getAllHomes() {
    const deployedHomeFactory = await this.HomeFactory.deployed();
    deployedHomeFactory.getHomes({from: this.model.account }).then( (res) => {
      this.homes = new Array<string>();
      for (var i = 0; i < res.length; i++) {
        deployedHomeFactory.getHomeByIndex(res[i]).then((result)=>{
          this.homes.push(result);
        })
      }
    });
  }

  async buyHome(index) {

    if (!this.HomeFactory) {
      this.setStatus('HomeFactory is not loaded, unable to send transaction');
      return;
    }

    const home = this.homes[index];
    const amount = (home[1] as any).words[0] as number;
    const receiver = home[3];
    const indexHome = (home[4] as any).words[0];

    console.log('Sending coins' + amount + ' to ' + receiver);

    this.setStatus('Initiating transaction... (please wait)');

    try {
      const deployedHomeFactory = await this.HomeFactory.deployed();
      const transaction = await deployedHomeFactory.sendCoinToBuyHome(receiver, indexHome, amount, {from: this.model.account, value: amount*10**18});

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
        this.getHomesByOwner();
        this.getAllHomes();
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending coin; see log.');
    }
  }

  setAddress(e) {
    console.log('Setting address: ' + e.target.value);
    this.homeModel.address = e.target.value;
  }

  setPrice(e) {
    console.log('Setting price: ' + e.target.value);
    this.homeModel.price = e.target.value;
  }

  setPicture(e) {
    console.log('Setting picture: ' + e.target.value);
    this.homeModel.picture = e.target.value;
  }

}

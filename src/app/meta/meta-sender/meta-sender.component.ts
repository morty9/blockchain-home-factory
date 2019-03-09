import {Component, OnInit} from '@angular/core';
import {Web3Service} from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';

declare let require: any;
const metacoin_artifacts = require('../../../../build/contracts/MetaCoin.json');
const home_artifacts = require('../../../../build/contracts/HomeFactory.json');

@Component({
  selector: 'app-meta-sender',
  templateUrl: './meta-sender.component.html',
  styleUrls: ['./meta-sender.component.css']
})
export class MetaSenderComponent implements OnInit {
  accounts: string[];
  MetaCoin: any;
  HomeFactory: any;

  model = {
    amount: 5,
    name: '',
    receiver: '',
    balance: 0,
    account: ''
  };

  homeModel = {
    address: '',
    price: '',
    picture: ''
  };

  status = '';

  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);
    this.watchAccount();
    this.web3Service.artifactsToContract(metacoin_artifacts)
      .then((MetaCoinAbstraction) => {
        this.MetaCoin = MetaCoinAbstraction;
        this.MetaCoin.deployed().then(deployed => {
          console.log(deployed);
          deployed.Transfer({}, (err, ev) => {
            console.log('Transfer event came in, refreshing balance');
            this.refreshBalance();
          });
        });

      });
      this.web3Service.artifactsToContract(home_artifacts)
        .then((HomeAbstraction) => {
          this.HomeFactory = HomeAbstraction;
          console.log("home factory init ", this.HomeFactory);
          // this.MetaCoin.deployed().then(deployed => {
          //   console.log(deployed);
          //   deployed.Transfer({}, (err, ev) => {
          //     console.log('Transfer event came in, refreshing balance');
          //     this.refreshBalance();
          //   });
          // });

        });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.account = accounts[0];
      this.refreshBalance();
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async createHome() {
    console.log("CREATE HOME CALL ", this.HomeFactory);
    const deployedHomeFactory = await this.HomeFactory.deployed();
    console.log("DEPLOYED ", deployedHomeFactory);
    console.log(this.model.account);
    deployedHomeFactory._createHome(this.homeModel.address, this.homeModel.price, this.homeModel.picture, {from : this.model.account});
  }

  async getHomesByOwner() {
    console.log("GET HOME CALL ", this.HomeFactory);
    const deployedHomeFactory = await this.HomeFactory.deployed();
    deployedHomeFactory.getHomesByOwner(this.model.account).then( (res) => {
      console.log(res);
      for (var i = 0; i < res.length; i++) {
        deployedHomeFactory.getHomeByIndex(res[i]).then((res)=>{
          console.log("home ", res);
        })
      }
    });
  }

  async sendCoin() {
    if (!this.MetaCoin) {
      this.setStatus('Metacoin is not loaded, unable to send transaction');
      return;
    }

    const amount = this.model.amount;
    const receiver = this.model.receiver;

    console.log('Sending coins' + amount + ' to ' + receiver);

    this.setStatus('Initiating transaction... (please wait)');
    try {
      const deployedMetaCoin = await this.MetaCoin.deployed();
      const transaction = await deployedMetaCoin.sendCoin.sendTransaction(receiver, amount, {from: this.model.account});

      if (!transaction) {
        this.setStatus('Transaction failed!');
      } else {
        this.setStatus('Transaction complete!');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error sending coin; see log.');
    }
  }

  async refreshBalance() {
    console.log('Refreshing balance');

    try {
      const deployedMetaCoin = await this.MetaCoin.deployed();
      console.log(deployedMetaCoin);
      console.log('Account', this.model.account);
      const metaCoinBalance = await deployedMetaCoin.getBalance.call(this.model.account);
      console.log('Found balance: ' + metaCoinBalance);
      this.model.balance = metaCoinBalance;
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }

  setAmount(e) {
    console.log('Setting amount: ' + e.target.value);
    this.model.amount = e.target.value;
  }

  setReceiver(e) {
    console.log('Setting receiver: ' + e.target.value);
    this.model.receiver = e.target.value;
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

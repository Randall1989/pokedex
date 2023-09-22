import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {


  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ){
  }

  async executeSeed() {

    await this.pokemonModel.deleteMany();

    const data= await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');

    //const insertPromisesArray = []; 
    const pokemonToInsert:{name: string, no:number}[] = [];

    data.results.forEach(({name, url}) => {
      const segments = url.split('/');
      const no:number = +segments[segments.length-2];

      //const pokemon = this.pokemonModel.create({name,no});
      /*insertPromisesArray.push(
        this.pokemonModel.create({name,no})
      );*/

      pokemonToInsert.push({name,no});
      console.log({name,no});

    });
    /*
    const resultPromise =  await Promise.all(insertPromisesArray);
    console.log(resultPromise);
    */
   await this.pokemonModel.insertMany(pokemonToInsert);

    return 'Seed Executed';
  }
}

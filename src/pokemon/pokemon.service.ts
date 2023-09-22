import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {

  private defaultLimit:number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ){
    this.defaultLimit = configService.get<number>('defaultLimit');
  }

  create(createPokemonDto: CreatePokemonDto) {

    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try{
      const pokemon = this.pokemonModel.create(createPokemonDto);

      return pokemon;
    }
    catch(error){
      this.handleExceptions(error);
    }
  }

  findAll(paginationDto:PaginationDto) {
    console.log(process.env.DEFAULT_LIMIT);
    const{limit =this.defaultLimit, offset =0} = paginationDto;

    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({no:1});
  }

 async findOne(term: string) {
    let pokemon: Pokemon;

    if (!isNaN(+term)){
      pokemon = await this.pokemonModel.findOne({no:term});
    }

    //Busqueda por MongID
    if(!pokemon && isValidObjectId(term)){
      pokemon = await this.pokemonModel.findById(term);
    }

    //Busqueda por Nombre
    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name:term.toLowerCase()});
    }

    if(!pokemon){
      throw new NotFoundException(`Pokemon  ${term}  not found `)
    }
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if(updatePokemonDto.name){
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try{
      await pokemon.updateOne(updatePokemonDto,{new:true});
      return {...pokemon.toJSON(),...updatePokemonDto};
    }
    catch(error){
      this.handleExceptions(error);
     }

  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);

    //await pokemon.deleteOne();
    const {deletedCount} = await this.pokemonModel.deleteOne({_id: id});

    if(deletedCount === 0){
      throw new BadRequestException(`Pokemon with id "${id}" not found`);
    }

    return;
  }

  private handleExceptions(error:any){
    if(error.code == 11000){
      throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`);
    }

    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
